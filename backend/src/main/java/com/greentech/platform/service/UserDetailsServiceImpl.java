package com.greentech.platform.service;

import com.greentech.platform.entity.UserEntity;
import com.greentech.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * 用户详情服务实现
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByEmailOrPhone(username)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + username));
        
        return User.builder()
                .username(user.getId()) // 使用用户ID作为用户名
                .password("") // 不使用密码，因为我们使用JWT
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .build();
    }
    
    /**
     * 根据用户ID加载用户详情
     */
    public UserDetails loadUserByUserId(String userId) throws UsernameNotFoundException {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + userId));
        
        return User.builder()
                .username(user.getId())
                .password("")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .build();
    }
}