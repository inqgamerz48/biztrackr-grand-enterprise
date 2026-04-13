import { useEffect, useState, useCallback } from 'react';

/**
 * Hook for real-time notifications via WebSocket with SSE fallback.
 * @param tenantId The multi-tenant ID to subscribe to.
 */
export const useNotifications = (tenantId: string | null) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'fallback'>('connecting');

    const addNotification = useCallback((data: any) => {
        setNotifications((prev) => [data, ...prev].slice(0, 50));
    }, []);

    useEffect(() => {
        if (!tenantId) return;

        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/api/v1/notifications/ws/${tenantId}`;
        const sseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/stream/${tenantId}`;

        let socket: WebSocket | null = null;
        let eventSource: EventSource | null = null;

        const connectWS = () => {
            try {
                socket = new WebSocket(wsUrl);
                setStatus('connecting');

                socket.onopen = () => {
                    console.log('✅ WebSocket Connected');
                    setStatus('connected');
                };

                socket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    addNotification(data);
                };

                socket.onerror = () => {
                    console.warn('⚠️ WebSocket Error, falling back to SSE...');
                    connectSSE();
                };

                socket.onclose = () => {
                    console.log('ℹ️ WebSocket Closed');
                };
            } catch (err) {
                console.error('❌ WebSocket implementation failed:', err);
                connectSSE();
            }
        };

        const connectSSE = () => {
            if (eventSource) return;
            
            console.log('📡 Switching to SSE Fallback...');
            setStatus('fallback');
            eventSource = new EventSource(sseUrl);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                addNotification(data);
            };

            eventSource.onerror = () => {
                console.error('❌ SSE Connection failed');
                setStatus('error');
                eventSource?.close();
            };
        };

        connectWS();

        return () => {
            socket?.close();
            eventSource?.close();
        };
    }, [tenantId, addNotification]);

    return { notifications, status };
};
