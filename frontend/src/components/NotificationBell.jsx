import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const userEmail = localStorage.getItem('user_email');
  const token = localStorage.getItem('jwt_token');

  useEffect(() => {
    if (!userEmail || !token) return;

    // 1. Fetch Historical Notifications
    fetchNotifications();

    // 2. Open the WebSocket Tunnel
    const stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('🔌 Connected to WebSocket Tunnel!');
        
        // Listen to our specific secure channel
        stompClient.subscribe(`/topic/notifications/${userEmail}`, (message) => {
          const newNotif = JSON.parse(message.body);
          
          // Add the new notification to the top of the list and increase unread count
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // OPTIONAL: You could trigger a browser toast or sound effect right here!
        });
      },
    });

    stompClient.activate();

    // 3. Close the dropdown if clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      stompClient.deactivate();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userEmail, token]);

  const fetchNotifications = async () => {
    try {
      // Create a quick backend endpoint to fetch notifications (we'll add this in Java next if missing)
      const res = await axios.get(`http://localhost:8080/api/notifications/${userEmail}`);
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (error) {
      console.error("Could not fetch notifications", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Could not mark as read", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error("Could not delete", error);
    }
  };

  // Helper to pick the right icon
  const getIcon = (type) => {
    switch(type) {
      case 'SUCCESS': return <CheckCircle size={18} color="#16a34a" />;
      case 'WARNING': return <AlertTriangle size={18} color="#ea580c" />;
      case 'ERROR': return <XCircle size={18} color="#dc2626" />;
      default: return <Info size={18} color="#2563eb" />;
    }
  };

  if (!token) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* THE BELL ICON */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Bell size={24} color="#3f3f46" />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '0', right: '0', background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* THE DROPDOWN PANEL */}
      {isOpen && (
        <div style={{ position: 'absolute', top: '120%', right: '0', width: '350px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e4e4e7', zIndex: 1000, overflow: 'hidden' }}>
          
          <div style={{ background: '#f8fafc', padding: '1rem', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Notifications</h3>
            {unreadCount > 0 && <span style={{ fontSize: '0.8rem', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold' }}>Mark all read</span>}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                <Bell size={32} style={{ opacity: 0.2, margin: '0 auto 0.5rem' }} />
                <p style={{ margin: 0 }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', background: notif.read ? 'white' : '#eff6ff', display: 'flex', gap: '1rem', transition: 'background 0.2s' }}>
                  <div style={{ marginTop: '0.2rem' }}>{getIcon(notif.type)}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#0f172a' }}>{notif.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>{notif.message}</p>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(notif.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {!notif.read && (
                      <button onClick={() => markAsRead(notif.id)} title="Mark as read" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '0.2rem' }}>
                        <Check size={16} />
                      </button>
                    )}
                    <button onClick={() => deleteNotification(notif.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}