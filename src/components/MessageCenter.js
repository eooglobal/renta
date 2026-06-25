'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher';

export default function MessageCenter() {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;

    const [conversations, setConversations] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
    const [isMobile, setIsMobile] = useState(false);
    const searchParams = useSearchParams();

    const messagesEndRef = useRef(null);

    const activeContactRef = useRef(activeContact);
    useEffect(() => {
        activeContactRef.current = activeContact;
    }, [activeContact]);

    // Track mobile breakpoint
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchConversations();
        if (!currentUserId) return;

        let pusher;
        const initPusher = async () => {
            try {
                const settingsRes = await fetch('/api/settings/public');
                const settings = await settingsRes.json();
                
                pusher = getPusherClient(settings.NEXT_PUBLIC_PUSHER_KEY, settings.NEXT_PUBLIC_PUSHER_CLUSTER);
                if (!pusher) return;

                const channel = pusher.subscribe(`user-${currentUserId}`);
                channel.bind('new-message', (data) => {
                    fetchConversations();
                    const currentActive = activeContactRef.current;
                    if (currentActive && (data.senderId === currentActive.id || data.receiverId === currentActive.id)) {
                        setMessages((prev) => {
                            if (prev.some(m => m.id === data.id)) return prev;
                            return [...prev, data];
                        });
                    }
                });
            } catch (err) {
                console.error('Pusher init failed:', err);
            }
        };

        initPusher();
        return () => {
            if (pusher) pusher.unsubscribe(`user-${currentUserId}`);
        };
    }, [currentUserId]);

    useEffect(() => {
        if (activeContact) {
            fetchMessages(activeContact.id);
        }
    }, [activeContact?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/messages');
            if (res.ok) {
                const data = await res.json();
                setConversations(data);

                // Handle "Start Thread" from query params
                const startWith = searchParams.get('startThreadWith');
                const propertyTitle = searchParams.get('title');
                const rentalId = searchParams.get('rentalId');

                if (startWith && !activeContact) {
                    const contactId = parseInt(startWith);
                    // Check if conversation already exists
                    const existingConv = data.find(c => c.contact.id === contactId);

                    if (existingConv) {
                        setActiveContact(existingConv.contact);
                        setMobileView('chat');
                    } else {
                        // Fetch user info for the new contact
                        const userRes = await fetch(`/api/users/${contactId}`);
                        if (userRes.ok) {
                            const userData = await userRes.json();
                            setActiveContact(userData);
                            setMobileView('chat');
                        }
                    }

                    if (rentalId && propertyTitle) {
                        setNewMessage(`Hi, I'm contacting you regarding my rental for "${decodeURIComponent(propertyTitle)}" (ID: #${rentalId}).`);
                    } else if (propertyTitle) {
                        setNewMessage(`Hi, I'm interested in "${decodeURIComponent(propertyTitle)}". Is it still available?`);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        } finally {
            setLoadingConvos(false);
        }
    };

    const fetchMessages = async (contactId, silent = false) => {
        if (!silent) setLoadingMessages(true);
        try {
            const res = await fetch(`/api/messages?withUserId=${contactId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                // Refresh conversation list to clear unread badge
                if (!silent) fetchConversations();
            }
        } catch (err) {
            console.error('Failed to fetch messages', err);
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact || sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: activeContact.id,
                    content: newMessage
                })
            });

            if (res.ok) {
                const newMsg = await res.json();
                setMessages(prev => [...prev, newMsg]);
                setNewMessage('');
                fetchConversations(); // Update latest message snippet
            }
        } catch (err) {
            console.error('Failed to send', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="card fade-in" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 140px)', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .msg-sidebar {
                    width: 100%;
                    border-right: none;
                    flex-direction: column;
                    background: var(--bg-secondary);
                }
                @media (min-width: 768px) {
                    .msg-sidebar {
                        width: 340px;
                        border-right: 1px solid var(--border-color);
                    }
                }
                .msg-thread {
                    flex: 1;
                    flex-direction: column;
                    background: var(--bg-card);
                    position: relative;
                }
                .msg-back-btn {
                    display: block;
                }
                @media (min-width: 768px) {
                    .msg-back-btn {
                        display: none !important;
                    }
                }

                .contact-item {
                    padding: var(--space-4);
                    border-bottom: 1px solid var(--border-color);
                    cursor: pointer;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    transition: all 0.2s ease;
                }
                .contact-item:hover {
                    background: var(--bg-card);
                    transform: translateX(4px);
                }
                .contact-item.active {
                    background: var(--bg-card);
                    border-left: 4px solid var(--color-primary);
                }

                /* Scrollbar styling for a cleaner look */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #a0aec0;
                }
            `}} />

            <div className="flex h-full" style={{ flexDirection: 'row', flex: 1, overflow: 'hidden' }}>

                {/* Left Sidebar: Conversation List */}
                <div
                    className="msg-sidebar"
                    style={{ display: isMobile && mobileView === 'chat' ? 'none' : 'flex' }}
                >
                    <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} /> Messages
                        </h3>
                    </div>

                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                        {loadingConvos ? (
                            <div className="flex justify-center items-center h-full text-muted">
                                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center text-muted" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                    <MessageSquare size={28} style={{ color: 'var(--color-primary)' }} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>No conversations yet</p>
                                    <p className="text-xs mt-2 leading-relaxed" style={{ maxWidth: '260px' }}>
                                        You can message {session?.user?.role === 'LANDLORD' ? 'your tenants' : 'your landlords'} once you have an active rental.
                                    </p>
                                </div>
                                <a
                                    href={session?.user?.role === 'LANDLORD' ? '/landlord/tenants' : '/tenant/rentals'}
                                    style={{
                                        marginTop: '0.5rem', padding: '10px 24px', fontSize: '13px',
                                        background: 'var(--color-primary)', color: 'var(--color-black)',
                                        borderRadius: 'var(--radius-lg)', fontWeight: '600',
                                        textDecoration: 'none', display: 'inline-block',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.2s'
                                    }}
                                >
                                    {session?.user?.role === 'LANDLORD' ? 'View My Tenants' : 'View My Rentals'}
                                </a>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.contact.id}
                                    onClick={() => { setActiveContact(conv.contact); setMobileView('chat'); }}
                                    className={`contact-item ${activeContact?.id === conv.contact.id ? 'active' : ''}`}
                                >
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #fcd34d 100%)', color: 'var(--color-black)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '16px', fontWeight: 'bold', flexShrink: 0,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        {conv.contact.firstName?.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 style={{ fontSize: '15px', fontWeight: '600', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {conv.contact.firstName} {conv.contact.lastName}
                                            </h4>
                                            {conv.lastMessage && (
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    {formatTime(conv.lastMessage.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p style={{
                                                fontSize: '13px', margin: 0, color: conv.unreadCount > 0 ? 'var(--text-color)' : 'var(--text-muted)',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                fontWeight: conv.unreadCount > 0 ? '600' : 'normal',
                                            }}>
                                                {conv.lastMessage?.senderId === currentUserId ? 'You: ' : ''}
                                                {conv.lastMessage?.content || 'Started a conversation'}
                                            </p>
                                            {conv.unreadCount > 0 && (
                                                <span style={{
                                                    background: 'var(--color-error)', color: 'white',
                                                    fontSize: '10px', fontWeight: 'bold', padding: '2px 6px',
                                                    borderRadius: '10px', minWidth: '18px', textAlign: 'center',
                                                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                                                }}>
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side: Active Chat Thread */}
                <div
                    className="msg-thread"
                    style={{
                        display: isMobile && mobileView === 'list' ? 'none' : 'flex',
                        backgroundImage: !activeContact ? 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23f3f4f6\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' : 'none'
                    }}
                >

                    {activeContact ? (
                        <>
                            {/* Chat Header */}
                            <div style={{
                                padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)',
                                zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <button
                                    onClick={() => { setActiveContact(null); setMobileView('list'); }}
                                    className="msg-back-btn btn btn-ghost btn-sm p-1"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #fcd34d 100%)', color: 'var(--color-black)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '16px'
                                }}>
                                    {activeContact.firstName?.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', margin: 0, fontWeight: 'bold' }}>
                                        {activeContact.firstName} {activeContact.lastName}
                                    </h3>
                                    <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-muted)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }}></span>
                                        {activeContact.role.toLowerCase()}
                                    </p>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="custom-scrollbar" style={{ flex: 1, padding: 'var(--space-4)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', background: 'var(--bg-secondary)' }}>
                                {loadingMessages ? (
                                    <div className="flex justify-center items-center h-full text-muted">
                                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex justify-center items-center h-full text-muted flex-col gap-3">
                                        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                            <MessageSquare size={40} style={{ color: 'var(--color-primary)' }} />
                                        </div>
                                        <p className="text-sm font-medium mt-2">Say hello to {activeContact.firstName}!</p>
                                        <p className="text-xs text-center" style={{ maxWidth: '250px' }}>This is the beginning of your direct message history with this user.</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMine = msg.senderId === currentUserId;
                                        const showDate = index === 0 || new Date(messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                                        return (
                                            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                                {showDate && (
                                                    <div style={{ textAlign: 'center', margin: 'var(--space-6) 0 var(--space-2)' }}>
                                                        <span style={{ fontSize: '11px', background: 'var(--bg-card)', padding: '4px 12px', borderRadius: '12px', color: 'var(--text-muted)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontWeight: '500' }}>
                                                            {new Date(msg.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div style={{
                                                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                                                    maxWidth: '80%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: isMine ? 'flex-end' : 'flex-start'
                                                }}>
                                                    <div style={{
                                                        background: isMine ? 'var(--color-primary)' : 'var(--bg-card)',
                                                        color: isMine ? 'var(--color-black)' : 'var(--text-color)',
                                                        padding: '12px 16px',
                                                        borderRadius: '20px',
                                                        borderBottomRightRadius: isMine ? '4px' : '20px',
                                                        borderBottomLeftRadius: isMine ? '20px' : '4px',
                                                        fontSize: '14px',
                                                        lineHeight: '1.5',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                                                        fontWeight: isMine ? '500' : 'normal'
                                                    }}>
                                                        {msg.content}
                                                    </div>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', padding: '0 8px' }}>
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input Box */}
                            <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', zIndex: 10 }}>
                                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            style={{
                                                width: '100%', padding: '14px 20px', borderRadius: 'var(--radius-full)',
                                                border: '1px solid var(--border-color)', outline: 'none',
                                                background: 'var(--bg-secondary)', color: 'var(--text-color)',
                                                fontSize: '14px', transition: 'border-color 0.2s, box-shadow 0.2s',
                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--color-primary)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(254, 219, 107, 0.2)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)';
                                            }}
                                            disabled={sending}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sending}
                                        style={{
                                            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                                            background: !newMessage.trim() ? 'var(--bg-secondary)' : 'var(--color-primary)',
                                            color: !newMessage.trim() ? 'var(--text-muted)' : 'var(--color-black)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: 'none', cursor: !newMessage.trim() ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: !newMessage.trim() ? 'none' : '0 4px 10px rgba(254, 219, 107, 0.4)',
                                            transform: newMessage.trim() && !sending ? 'scale(1.05)' : 'scale(1)'
                                        }}
                                    >
                                        {sending ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} style={{ marginLeft: '2px', transform: 'rotate(-5deg)' }} />}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center items-center h-full flex-col gap-6 text-center" style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
                                <MessageSquare size={48} style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '8px' }}>Your Message Center</h3>
                                <p style={{ fontSize: '15px', maxWidth: '320px', margin: '0 auto', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                    Select a conversation from the sidebar to view your chat history or send a new direct message.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
