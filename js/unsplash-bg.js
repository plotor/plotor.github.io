(function (window) {
  'use strict'

  var Stun = window.Stun || {}

  Stun.unsplash = {
    cacheKey: 'stun_unsplash_bg_cache',
    
    getCache: function () {
      try {
        var cache = localStorage.getItem(this.cacheKey)
        if (!cache) return null
        
        var data = JSON.parse(cache)
        var now = Date.now()
        var cacheDuration = (CONFIG.unsplash.cache_duration || 24) * 60 * 60 * 1000
        
        if (now - data.timestamp < cacheDuration) {
          return data
        }
        
        localStorage.removeItem(this.cacheKey)
        return null
      } catch (e) {
        return null
      }
    },
    
    setCache: function (imageUrl, photoInfo) {
      try {
        var data = {
          imageUrl: imageUrl,
          photoInfo: photoInfo,
          timestamp: Date.now()
        }
        localStorage.setItem(this.cacheKey, JSON.stringify(data))
      } catch (e) {
      }
    },
    
    fetchRandomPhoto: function () {
      var self = this
      var config = CONFIG.unsplash
      
      if (!config.apiKey) {
        return Promise.reject(new Error('API key not configured'))
      }
      
      var url = 'https://api.unsplash.com/photos/random?'
      var params = {
        client_id: config.apiKey,
        orientation: config.orientation || 'landscape',
        w: config.width || 1920,
        h: config.height || 1080
      }
      
      if (config.collections) {
        params.collections = config.collections
      }
      
      var queryString = Object.keys(params)
        .map(function (key) {
          return key + '=' + encodeURIComponent(params[key])
        })
        .join('&')
      
      return fetch(url + queryString)
        .then(function (response) {
          if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status)
          }
          return response.json()
        })
        .then(function (data) {
          var imageUrl = data.urls.custom || data.urls.regular || data.urls.full
          var photoInfo = {
            author: data.user.name,
            link: data.links.html,
            description: data.description || data.alt_description
          }
          
          self.setCache(imageUrl, photoInfo)
          
          return {
            imageUrl: imageUrl,
            photoInfo: photoInfo
          }
        })
    },
    
    applyBackgroundImage: function (imageUrl) {
      var banner = document.querySelector('.header-banner.unsplash-bg')
      if (!banner) {
        return
      }
      
      var img = new Image()
      img.onload = function () {
        banner.style.background = 'url(' + imageUrl + ') no-repeat center/cover'
        banner.classList.remove('unsplash-bg')
        banner.classList.add('unsplash-bg-loaded')
      }
      img.onerror = function () {
        banner.classList.remove('unsplash-bg')
      }
      img.src = imageUrl
    },
    
    init: function () {
      var self = this
      
      if (!CONFIG.unsplash || !CONFIG.unsplash.enable) {
        return
      }
      
      var cache = this.getCache()
      
      if (cache) {
        this.applyBackgroundImage(cache.imageUrl)
        return
      }
      
      this.fetchRandomPhoto()
        .then(function (result) {
          self.applyBackgroundImage(result.imageUrl)
        })
        .catch(function (error) {
          var banner = document.querySelector('.header-banner.unsplash-bg')
          if (banner) {
            banner.classList.remove('unsplash-bg')
          }
        })
    }
  }

  window.Stun = Stun
})(window)
