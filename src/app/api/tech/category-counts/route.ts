import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CategoryCountsResponse {
  success: boolean;
  data?: {
    totalTechnologyCount: number;
    categories: Array<{
      id: string;
      slug: string;
      nameZh: string;
      nameEn: string;
      count: number;
      subcategories: Array<{
        id: string;
        slug: string;
        nameZh: string;
        nameEn: string;
        count: number;
        sortOrder?: number;
        isVirtual?: boolean;
      }>;
    }>;
  };
  error?: string;
}

type CategoryCountsPayload = NonNullable<CategoryCountsResponse['data']>;
type CategoryCount = CategoryCountsPayload['categories'][number];
type SubcategoryCount = CategoryCount['subcategories'][number];

interface RawSubcategory {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string;
  is_active: boolean | null;
  sort_order: number | null;
}

interface RawCategory {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string;
  is_active: boolean | null;
  sort_order: number | null;
  subcategories: RawSubcategory[] | null;
}

export async function GET(): Promise<NextResponse<CategoryCountsResponse>> {
  const db = supabaseAdmin;

  if (!db) {
    return NextResponse.json(
      {
        success: false,
        error: 'Admin Supabase client is not available',
      },
      { status: 500 }
    );
  }

  try {
    const [{ data: rawCategories, error: categoriesError }, { count: totalTechnologyCount, error: totalCountError }] = await Promise.all([
      db
        .from('admin_categories')
        .select(
          `id, slug, name_zh, name_en, is_active, sort_order,
           subcategories:admin_subcategories(id, slug, name_zh, name_en, is_active, sort_order)`
        )
        .order('sort_order', { ascending: true }),
      db
        .from('admin_technologies')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('review_status', 'published'),
    ]);

    if (categoriesError) {
      console.error('Failed to query admin_categories:', categoriesError);
      return NextResponse.json(
        {
          success: false,
          data: {
            totalTechnologyCount: 0,
            categories: [],
          },
          error: categoriesError.message || 'Failed to query categories',
        },
        { status: 500 }
      );
    }

    if (totalCountError) {
      console.error('Failed to query admin_technologies total count:', totalCountError);
      return NextResponse.json(
        {
          success: false,
          data: {
            totalTechnologyCount: 0,
            categories: [],
          },
          error: totalCountError.message || 'Failed to query technologies',
        },
        { status: 500 }
      );
    }

    const categories = (await Promise.all(
      ((rawCategories as RawCategory[] | null) || [])
        .filter((category) => category?.is_active !== false)
        .map(async (category): Promise<CategoryCount | undefined> => {
          const { count: categoryCount, error: categoryCountError } = await db
            .from('admin_technologies')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .eq('review_status', 'published')
            .eq('category_id', category.id);

          if (categoryCountError) {
            console.warn(`Failed to count technologies for category ${category.id}:`, categoryCountError);
          }

          const subcategoriesData = Array.isArray(category.subcategories) ? category.subcategories : [];

          const subcategories = await Promise.all(
            subcategoriesData
              .filter((sub) => sub?.is_active !== false)
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map(async (sub): Promise<SubcategoryCount> => {
                const { count: subCount, error: subCountError } = await db
                  .from('admin_technologies')
                  .select('id', { count: 'exact', head: true })
                  .eq('is_active', true)
                  .eq('review_status', 'published')
                  .eq('subcategory_id', sub.id);

                if (subCountError) {
                  console.warn(`Failed to count technologies for subcategory ${sub.id}:`, subCountError);
                }

                return {
                  id: sub.id,
                  slug: sub.slug,
                  nameZh: sub.name_zh,
                  nameEn: sub.name_en,
                  count: subCount || 0,
                  sortOrder: sub.sort_order ?? 0,
                };
              })
          );

          const sumSubCounts = subcategories.reduce((total, item) => total + (item.count || 0), 0);
          const uncategorized = Math.max((categoryCount || 0) - sumSubCounts, 0);

          const enhancedSubcategories: SubcategoryCount[] = [...subcategories];

          if (uncategorized > 0) {
            enhancedSubcategories.push({
              id: `uncategorized-${category.id}`,
              slug: `${category.slug || category.id}-uncategorized`,
              nameZh: '未分配子分类',
              nameEn: 'Unassigned',
              count: uncategorized,
              sortOrder: Number.MAX_SAFE_INTEGER,
              isVirtual: true,
            });
          }

          return {
            id: category.id,
            slug: category.slug,
            nameZh: category.name_zh,
            nameEn: category.name_en,
            count: categoryCount || 0,
            subcategories: enhancedSubcategories,
          };
        })
    )).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        totalTechnologyCount: totalTechnologyCount || 0,
        categories,
      },
    });
  } catch (error) {
    console.error('Failed to load category counts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
