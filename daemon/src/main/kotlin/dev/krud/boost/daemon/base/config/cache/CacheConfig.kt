package dev.krud.boost.daemon.base.config.cache

import com.github.benmanes.caffeine.cache.Caffeine
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.caffeine.CaffeineCache
import org.springframework.cache.support.SimpleCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
@EnableCaching
class CacheConfig {
    @Bean
    fun cacheManager(cacheProperties: CacheProperties): CacheManager {
        val cacheManager = SimpleCacheManager()
        val caches = cacheProperties.caches.map { dto ->
            CaffeineCache(
                dto.name,
                Caffeine.newBuilder()
                    .apply {
                        dto.expireAfterWrite?.let { expireAfterWrite(it) }
                        dto.expireAfterAccess?.let { expireAfterAccess(it) }
                        dto.maximumSize?.let { maximumSize(it) }
                    }
                    .build()
            )
        }
        cacheManager.setCaches(caches)
        return cacheManager
    }
}