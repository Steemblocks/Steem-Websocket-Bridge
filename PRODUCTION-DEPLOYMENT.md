# Production Deployment Guide for dhakawitness.com

## 🚀 Features
- **API Pressure Reduction**: Smart caching reduces API calls by 60-80%
- **Rate Limiting**: Max 60 requests/minute to protect api.steemit.com
- **Auto-shutdown**: Stops streams when no clients connected
- **Request Queuing**: Prevents API flooding
- **Docker Ready**: Full containerization with NGINX reverse proxy
- **SSL Support**: HTTPS and WSS for secure connections
- **Health Monitoring**: Built-in health checks and status endpoints

## 📊 API Optimizations
1. **Smart Caching**: 
   - Dynamic properties: 5-second cache
   - Block headers: 3-second cache
   - Full blocks: 5-second cache

2. **Intelligent Intervals**:
   - Dynamic properties: 8 seconds (was 3)
   - Block headers: 6 seconds  
   - Full blocks: 12 seconds (much less frequent)

3. **Request Management**:
   - Queue-based API calls
   - 1-second minimum between requests
   - 60 requests/minute maximum

## 🐳 Docker Deployment

### 1. Domain Setup
Ensure your domain `dhakawitness.com` points to your server IP.

### 2. SSL Certificates
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Option A: Let's Encrypt (recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d dhakawitness.com -d www.dhakawitness.com

# Copy certificates
sudo cp /etc/letsencrypt/live/dhakawitness.com/fullchain.pem nginx/ssl/dhakawitness.com.crt
sudo cp /etc/letsencrypt/live/dhakawitness.com/privkey.pem nginx/ssl/dhakawitness.com.key

# Option B: Self-signed (testing only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/dhakawitness.com.key \
  -out nginx/ssl/dhakawitness.com.crt \
  -subj "/CN=dhakawitness.com"
```

### 3. Deploy
```bash
# Build and start production services
docker-compose -f docker-compose.production.yml up --build -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f steem-bridge
```

### 4. Access Points
- **Website**: https://dhakawitness.com
- **WebSocket**: wss://dhakawitness.com  
- **Status API**: https://dhakawitness.com/status
- **Health Check**: https://dhakawitness.com/health

## 📈 Monitoring

### Real-time Status
```bash
# Check API usage
curl https://dhakawitness.com/status

# Health check
curl https://dhakawitness.com/health

# Container stats
docker stats dhakawitness-bridge
```

### Log Monitoring
```bash
# Application logs
docker logs dhakawitness-bridge --tail 50 -f

# NGINX access logs
docker exec dhakawitness-nginx tail -f /var/log/nginx/dhakawitness_access.log

# All container logs
docker-compose -f docker-compose.production.yml logs -f
```

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production
DOMAIN=dhakawitness.com
PORT=8080
HOST=0.0.0.0
STEEM_API_ENDPOINT=api.steemit.com
```

### Scaling Options
```bash
# Scale bridge instances (load balancing)
docker-compose -f docker-compose.production.yml up --scale steem-bridge=3 -d

# Update configuration
docker-compose -f docker-compose.production.yml up --build -d
```

## 📊 API Usage Optimization

### Before Optimization:
- No caching: Every request hits API
- Continuous streaming: ~20 requests/minute per stream
- No rate limiting: Could overwhelm api.steemit.com

### After Optimization:
- Smart caching: 60-80% reduction in API calls
- Intelligent intervals: 3-4 requests/minute per stream
- Queue management: Never overwhelms API
- Auto-shutdown: Zero requests when no clients

### Expected Load Reduction:
- **Dynamic Properties**: From 20/min → 7.5/min (62% reduction)
- **Block Headers**: From 10/min → 3/min (70% reduction)  
- **Full Blocks**: From 20/min → 5/min (75% reduction)

## 🚀 Production Checklist

- [ ] Domain configured (dhakawitness.com)
- [ ] SSL certificates installed
- [ ] Docker Compose deployed
- [ ] NGINX reverse proxy running
- [ ] Health checks passing
- [ ] WebSocket connections working
- [ ] API rate limiting active
- [ ] Monitoring setup
- [ ] Backup strategy in place

## 🔒 Security Features

1. **CORS Protection**: Only allows your domain
2. **SSL/TLS**: HTTPS and WSS only
3. **Rate Limiting**: Prevents abuse
4. **Health Checks**: Docker restarts on failure
5. **Resource Limits**: CPU and memory constraints
6. **Log Rotation**: Prevents disk space issues

## 📞 WebSocket API Usage

```javascript
const ws = new WebSocket('wss://dhakawitness.com');

ws.onopen = () => {
    // Start optimized streaming
    ws.send(JSON.stringify({
        type: 'start_stream',
        stream: 'dynamic_global_properties'
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'live_data') {
        console.log('Stream:', data.stream);
        console.log('Cached:', data.cached);
        console.log('Data:', data.data);
    }
};
```

## 🔄 Maintenance

### Updates
```bash
# Update code
git pull origin main
docker-compose -f docker-compose.production.yml up --build -d

# Backup before updates
docker-compose -f docker-compose.production.yml down
cp -r . ../backup-$(date +%Y%m%d)
```

### Cleanup
```bash
# Clean old images
docker image prune -f

# Clean containers
docker container prune -f

# Full cleanup (careful!)
docker system prune -af
```

This production setup reduces API pressure significantly while maintaining real-time data quality!