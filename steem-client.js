/**
 * Clean Steem Live Data Client
 * Simple integration for web applications
 */
class SteemLiveClient {
    constructor(websocketUrl = 'ws://localhost:8080') {
        this.ws = null;
        this.url = websocketUrl;
        this.isConnected = false;
        this.eventListeners = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    // Connect to WebSocket bridge
    connect() {
        try {
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                console.log('✅ Connected to Steem Live Data Bridge');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected');
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('❌ Disconnected from bridge');
                this.isConnected = false;
                this.emit('disconnected');
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', error);
            };
            
        } catch (error) {
            console.error('Connection error:', error);
            this.emit('error', error);
        }
    }
    
    // Handle messages from bridge
    handleMessage(data) {
        switch (data.type) {
            case 'welcome':
                this.emit('ready', data);
                break;
                
            case 'live_data':
                this.emit('data', {
                    stream: data.stream,
                    data: data.data,
                    timestamp: data.timestamp
                });
                this.emit(`data_${data.stream}`, data.data);
                break;
                
            case 'stream_started':
                this.emit('stream_started', data);
                break;
                
            case 'stream_stopped':
                this.emit('stream_stopped', data);
                break;
                
            case 'error':
                this.emit('stream_error', data);
                break;
                
            default:
                this.emit('message', data);
        }
    }
    
    // Start streaming dynamic global properties
    streamDynamicGlobalProperties() {
        this.send({
            type: 'start_stream',
            stream: 'dynamic_global_properties'
        });
    }
    
    // Start streaming block headers
    streamBlockHeaders() {
        this.send({
            type: 'start_stream',
            stream: 'block_header'
        });
    }
    
    // Start streaming full blocks
    streamBlocks() {
        this.send({
            type: 'start_stream',
            stream: 'block'
        });
    }
    
    // Get current block number
    getCurrentBlock() {
        this.send({
            type: 'get_current_block'
        });
    }
    
    // Stop a specific stream
    stopStream(streamName) {
        this.send({
            type: 'stop_stream',
            stream: streamName
        });
    }
    
    // Send message to bridge
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    // Event system
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    once(event, callback) {
        const onceWrapper = (...args) => {
            callback(...args);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }
    
    off(event, callback) {
        if (this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(callback);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
    }
    
    emit(event, ...args) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error('Event callback error:', error);
                }
            });
        }
    }
    
    // Auto-reconnect logic
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = 2000 * (this.reconnectAttempts + 1);
            console.log(`🔄 Reconnecting in ${delay/1000}s...`);
            
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect();
            }, delay);
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
}

// Usage Examples:

// Example 1: Basic Setup
const steemClient = new SteemLiveClient();

steemClient.connect();

steemClient.on('ready', () => {
    console.log('🚀 Bridge is ready!');
    
    // Start streaming dynamic global properties
    steemClient.streamDynamicGlobalProperties();
    
    // Start streaming block headers
    steemClient.streamBlockHeaders();
});

// Listen to dynamic global properties updates
steemClient.on('data_dynamic_global_properties', (data) => {
    console.log('🌐 Chain state:', data.head_block_number);
    console.log('👤 Current witness:', data.current_witness);
    console.log('💰 STEEM supply:', data.current_supply);
    console.log('💵 SBD supply:', data.current_sbd_supply);
    
    // Update your app UI
    document.getElementById('currentBlock').textContent = data.head_block_number;
    document.getElementById('currentWitness').textContent = data.current_witness;
    document.getElementById('steemSupply').textContent = data.current_supply;
});

// Listen to block headers
steemClient.on('data_block_header', (data) => {
    console.log('� Block header:', data.witness);
    console.log('🕐 Timestamp:', data.timestamp);
    
    // Update block header info
    updateBlockHeader(data);
});

// Listen to full blocks
steemClient.on('data_block', (data) => {
    console.log('🧱 Full block with', data.transactions_count, 'transactions');
    console.log('👤 Block producer:', data.witness);
    
    // Update block info
    updateBlockInfo(data);
});

// Listen to current block requests
steemClient.on('current_block', (data) => {
    console.log('� Current block number:', data.block_number);
});

// Example helper functions (implement these in your app)
function updateBlockHeader(headerData) {
    // Update your block header UI
    console.log('Block header from:', headerData.witness);
}

function updateBlockInfo(blockData) {
    // Update your block information display
    console.log('Block transactions:', blockData.transactions_count);
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SteemLiveClient;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.SteemLiveClient = SteemLiveClient;
}