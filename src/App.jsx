import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Brain,
  Trash2,
  Filter,
  ArrowRight,
  Mail,
  Send,
  MessageCircle,
  Smartphone,
  LogOut,
  Users,
  ShieldCheck,
  Zap,
  X,
  Network,
  CalendarDays,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, isPast } from 'date-fns';
import './App.css';

const PRIORITY_LEVELS = {
  CRITICAL: { color: '#ef4444', label: 'Critical' },
  HIGH: { color: '#f59e0b', label: 'High' },
  MEDIUM: { color: '#6366f1', label: 'Medium' },
  LOW: { color: '#10b981', label: 'Low' }
};

const MANAGER_CREDS = {
  username: 'admin',
  password: '123',
  name: 'Admin Manager',
  role: 'Manager',
  email: 'admin@aisync.com'
};

const INITIAL_STAFF = [
  { id: 'S1', username: 'adam', password: '111', name: 'Adam Jensen', email: 'adam@example.com', role: 'Staff' },
  { id: 'S2', username: 'sarah', password: '222', name: 'Sarah Connor', email: 'sarah@example.com', role: 'Staff' },
  { id: 'S3', username: 'james', password: '333', name: 'James Moriarty', email: 'james@example.com', role: 'Staff' },
  { id: 'S4', username: 'ripley', password: '444', name: 'Ellen Ripley', email: 'ripley@example.com', role: 'Staff' },
  { id: 'S5', username: 'wick', password: '555', name: 'John Wick', email: 'wick@example.com', role: 'Staff' },
  { id: 'S6', username: 'tony', password: '666', name: 'Tony Stark', email: 'tony@example.com', role: 'Staff' },
  { id: 'S7', username: 'diana', password: '777', name: 'Diana Prince', email: 'diana@example.com', role: 'Staff' },
  { id: 'S8', username: 'bruce', password: '888', name: 'Bruce Wayne', email: 'bruce@example.com', role: 'Staff' },
  { id: 'S9', username: 'peter', password: '999', name: 'Peter Parker', email: 'peter@example.com', role: 'Staff' },
  { id: 'S10', username: 'natasha', password: '000', name: 'Natasha Romanov', email: 'natasha@example.com', role: 'Staff' },
];


function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('ai-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [staffMembers, setStaffMembers] = useState(() => {
    const saved = localStorage.getItem('ai-staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('ai-notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [botApiKey, setBotApiKey] = useState(() => localStorage.getItem('bot-api-key') || '');
  const [n8nUrl, setN8nUrl] = useState(() => localStorage.getItem('n8n-webhook-url') || '');
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('active-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [selectedStaffDetails, setSelectedStaffDetails] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  // New task state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '', // Now combined date+time
    assignees: [],
    phone: '',
    reminderOffset: 30, // Default 30 min before
    priority: 'MEDIUM'
  });
  const [formErrors, setFormErrors] = useState({});
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', username: '', password: '', email: '' });



  useEffect(() => {
    localStorage.setItem('ai-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ai-staff', JSON.stringify(staffMembers));
  }, [staffMembers]);

  useEffect(() => {
    localStorage.setItem('ai-notifications', JSON.stringify(notifications));
  }, [notifications]);


  useEffect(() => {
    localStorage.setItem('bot-api-key', botApiKey);
  }, [botApiKey]);

  useEffect(() => {
    localStorage.setItem('n8n-webhook-url', n8nUrl);
  }, [n8nUrl]);

  useEffect(() => {
    localStorage.setItem('active-user', JSON.stringify(currentUser));
  }, [currentUser]);
  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.error("Sound play failed", e));
  };

  // Background Automated Reminder Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (!task.completed && (task.deadline || task.reminderTime)) {
          const deadlineDate = new Date(task.deadline || task.reminderTime);
          const reminderOffset = task.reminderOffset || 30; // default 30 mins
          const triggerTime = new Date(deadlineDate.getTime() - (reminderOffset * 60000));

          if (now >= triggerTime && !task.reminderSent) {
            // 1. Desktop Notification
            if (Notification.permission === "granted") {
              new Notification("AI System Alert", {
                body: `Action Required: ${task.title} is approaching its deadline.`
              });
            }


            // 2. In-App Notification
            const newNotif = {
              id: Date.now() + Math.random(),
              title: 'Task Reminder',
              message: `Task "${task.title}" is due now!`,
              type: 'warning',
              timestamp: new Date().toISOString()
            };
            setNotifications(prev => [newNotif, ...prev]);
            playNotificationSound();


            if (botApiKey && task.phone) {
              const assigneeText = Array.isArray(task.assignees)
                ? task.assignees.map(a => a.name).join(', ')
                : task.assignee;
              const text = `*AUTOMATIC REMINDER*\n\n📌 Task: ${task.title}\n👤 Assignees: ${assigneeText}\n📅 Deadline: ${task.deadline || 'N/A'}\n🧠 AI Priority: ${Math.round(task.score)}`;
              const cleanNumber = task.phone.replace(/\D/g, '');


              fetch(`https://api.callmebot.com/whatsapp.php?phone=${cleanNumber}&text=${encodeURIComponent(text)}&apikey=${botApiKey}`, {
                mode: 'no-cors'
              });
            }

            // 3. N8N WEBHOOK TRIGGER (CORS-Safe Form Mode)
            if (n8nUrl) {
              const formData = new URLSearchParams();
              formData.append('event', 'task_reminder');
              formData.append('task_title', task.title);
              formData.append('task_desc', task.description);
              formData.append('assignee_name', Array.isArray(task.assignees) ? task.assignees.map(a => a.name).join(', ') : task.assignee);
              formData.append('assignee_email', Array.isArray(task.assignees) ? task.assignees.map(a => a.email).join(', ') : task.email);
              formData.append('phone_number', task.phone);

              formData.append('priority_score', Math.round(task.score));
              formData.append('deadline', task.deadline);
              formData.append('timestamp', new Date().toISOString());

              fetch(n8nUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
              }).catch(err => console.error("n8n Trigger Failed", err));
            }

            // Mark as sent
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, reminderSent: true } : t));
          }
        }
      });
    }, 20000); // Check every 20 seconds for better accuracy

    return () => clearInterval(interval);
  }, [tasks, botApiKey, n8nUrl]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    // Check Manager
    if (loginData.username === MANAGER_CREDS.username && loginData.password === MANAGER_CREDS.password) {
      setCurrentUser(MANAGER_CREDS);
      // Show welcome notification
      const welcomeNotif = {
        id: Date.now() + Math.random(),
        title: `Welcome, Commander`,
        message: 'Master control center active.',
        type: 'info',
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => [welcomeNotif, ...prev]);
      return;
    }

    // Check Staff
    const staff = staffMembers.find(s => s.username === loginData.username && s.password === loginData.password);

    if (staff) {
      setCurrentUser(staff);
      // Show welcome notification
      const welcomeNotif = {
        id: Date.now() + Math.random(),
        title: `Welcome, ${staff.name}`,
        message: 'Strategic operations dashboard initialized.',
        type: 'info',
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => [welcomeNotif, ...prev]);
    } else {
      setLoginError('Invalid username or password. (Hint: admin/123 or adam/111)');
    }
  };


  const triggerN8nManual = (task) => {
    if (!n8nUrl) {
      alert("Please enter your n8n Webhook URL in the sidebar first.");
      return;
    }

    setIsSending(true);
    const formData = new URLSearchParams();
    formData.append('event', 'manual_trigger');
    formData.append('task_title', task.title);
    formData.append('task_desc', task.description);
    formData.append('assignee_name', Array.isArray(task.assignees) ? task.assignees.map(a => a.name).join(', ') : task.assignee);
    formData.append('assignee_email', Array.isArray(task.assignees) ? task.assignees.map(a => a.email).join(', ') : (task.email || ''));
    formData.append('phone_number', task.phone || '');

    formData.append('priority_score', Math.round(task.score));
    formData.append('deadline', task.deadline || '');
    formData.append('timestamp', new Date().toISOString());

    fetch(n8nUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })
      .then(() => {
        alert(`✅ Signal sent to n8n for "${task.title}"!`);
        setIsSending(false);
      })
      .catch(err => {
        alert("Failed to trigger n8n: " + err.message);
        setIsSending(false);
      });
  };

  const calculateScore = (task) => {
    const daysLeft = task.deadline ? differenceInDays(new Date(task.deadline), new Date()) : 14;
    const urgency = Math.max(0, 10 - Math.max(0, daysLeft));

    let importance = task.importance || 5;
    let effort = task.effort || 5;

    if (task.priority) {
      if (task.priority === 'CRITICAL') { importance = 10; effort = 1; }
      else if (task.priority === 'HIGH') { importance = 8; effort = 3; }
      else if (task.priority === 'MEDIUM') { importance = 6; effort = 5; }
      else if (task.priority === 'LOW') { importance = 3; effort = 8; }
    }

    // AI Score Logic: Importance x 10 + Urgency x 8 - Effort x 2
    let score = (importance * 10) + (urgency * 8) - (effort * 2);

    // Boost score for tasks due today or overdue
    if (task.deadline && isPast(new Date(task.deadline))) {
      score += 50;
    }

    return score;
  };

  const sendWhatsApp = (task) => {
    const assigneeNames = Array.isArray(task.assignees) ? task.assignees.map(a => a.name).join(', ') : (task.assignee || 'You');
    const text = `*AIsync Reminder for ${assigneeNames}*\n\n` +
      `📌 *Task:* ${task.title}\n` +

      `📝 *Details:* ${task.description || 'N/A'}\n` +
      `📅 *Deadline:* ${task.deadline || 'No date'}\n` +
      `🧠 *AI Priority Score:* ${Math.round(task.score)}\n`;

    const message = encodeURIComponent(text);
    const cleanNumber = task.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  const testBotConnection = () => {
    if (!botApiKey) {
      alert("Please enter your CallMeBot API Key first.");
      return;
    }
    const testPhone = prompt("Enter your phone number (with country code, e.g., +1234567890) to send a test message:");
    if (!testPhone) return;

    const cleanNumber = testPhone.replace(/\D/g, '');
    const text = "🚀 *AIsync Connection Test*\n\nYour CallMeBot API is successfully connected to AIsync! Automated reminders are now active.";

    fetch(`https://api.callmebot.com/whatsapp.php?phone=${cleanNumber}&text=${encodeURIComponent(text)}&apikey=${botApiKey}`, {
      mode: 'no-cors'
    })
      .then(() => alert("Test message sent! Please check your WhatsApp."))
      .catch(err => alert("Failed to send test message: " + err.message));
  };

  const testN8nConnection = () => {
    if (!n8nUrl) {
      alert("Please enter your n8n Webhook URL first.");
      return;
    }

    const formData = new URLSearchParams();
    formData.append('event', 'test_connection');
    formData.append('message', '🚀 AIsync n8n Connection Test Successful!');
    formData.append('assignee_email', 'test@example.com');
    formData.append('timestamp', new Date().toISOString());

    fetch(n8nUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })
      .then(() => {
        alert("✅ Test signal sent! Check your n8n 'Listen for Test Event' window. You should now see separate fields for Email, Event, etc.");
      })
      .catch(err => {
        console.error(err);
        alert("❌ Failed to send request. Check your URL.");
      });
  };

  const prioritizedTasks = useMemo(() => {
    return tasks
      .map(task => ({ ...task, score: calculateScore(task) }))
      .sort((a, b) => b.score - a.score);
  }, [tasks]);

  const filteredTasks = prioritizedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const isAssigned = Array.isArray(task.assignees)
      ? task.assignees.some(a => a.email === currentUser?.email)
      : task.email === currentUser?.email;
    const matchesRole = currentUser?.role === 'Manager' || isAssigned;


    // Status Filter
    let matchesStatus = true;
    if (filter === 'completed') matchesStatus = task.completed;
    if (filter === 'pending') matchesStatus = !task.completed;

    // Priority Filter
    let matchesPriority = true;
    if (priorityFilter !== 'all') {
      const info = getPriorityInfo(task.score);
      matchesPriority = info.label.toLowerCase() === priorityFilter.toLowerCase();
    }

    // Team Filter (Manager only)
    let matchesTeam = true;
    if (currentUser?.role === 'Manager' && teamFilter !== 'all') {
      matchesTeam = Array.isArray(task.assignees)
        ? task.assignees.some(a => a.email === teamFilter)
        : task.email === teamFilter;
    }


    return matchesSearch && matchesRole && matchesStatus && matchesPriority && matchesTeam;
  });

  const addTask = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newTask.title.trim()) errors.title = "Task objective is required";
    if (newTask.assignees.length === 0) errors.assignee = "Please select at least one team member";
    if (!newTask.deadline) errors.deadline = "Deadline date and time is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const task = {
      ...newTask,
      id: Date.now(),
      completed: false,
      status: 'Not Started',
      reminderSent: false,
      createdAt: new Date().toISOString(),
      score: calculateScore(newTask)
    };

    setTasks([task, ...tasks]);

    // Add Notification for all assignees
    const newNotif = {
      id: Date.now() + Math.random(),
      title: 'New Mission Assigned',
      message: `You have been assigned to: "${task.title}"`,
      type: 'info',
      timestamp: new Date().toISOString(),
      assignees: task.assignees.map(a => a.email)
    };
    setNotifications(prev => [newNotif, ...prev]);
    playNotificationSound();

    setNewTask({ title: '', description: '', deadline: '', assignees: [], phone: '', reminderOffset: 30, priority: 'MEDIUM' });
    setFormErrors({});
    setShowAssigneeDropdown(false);


    setIsModalOpen(false);

    if (Notification.permission === "granted") {
      const assigneeNames = task.assignees.map(a => a.name).join(', ');
      new Notification("Task Assigned!", {
        body: `"${task.title}" successfully assigned to ${assigneeNames}.`,
        icon: "/vite.svg"
      });

    }
  };

  const toggleComplete = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task.completed) {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: false, status: 'In Progress', completedTime: null, perfStatus: null } : t));
    } else {
      completeTask(id);
    }
  };


  const getCompletionStatus = (task, completedDate) => {
    const deadline = new Date(task.deadline);
    const completed = new Date(completedDate);
    const diff = deadline.getTime() - completed.getTime();
    const oneHour = 60 * 60 * 1000;

    if (diff > oneHour) return 'Early';
    if (diff < -oneHour) return 'Delayed';
    return 'On Time';
  };

  const startTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'In Progress', startTime: new Date().toISOString() } : t));
  };

  const completeTask = (id) => {
    const completedTime = new Date().toISOString();
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          completed: true,
          status: 'Completed',
          completedTime,
          perfStatus: getCompletionStatus(t, completedTime)
        };
      }
      return t;
    }));
  };

  const deleteTask = (id) => {

    setTasks(tasks.filter(t => t.id !== id));
    setTaskToDelete(null);
  };


  const getPriorityInfo = (score) => {
    if (score > 120) return PRIORITY_LEVELS.CRITICAL;
    if (score > 80) return PRIORITY_LEVELS.HIGH;
    if (score > 40) return PRIORITY_LEVELS.MEDIUM;
    return PRIORITY_LEVELS.LOW;
  };

  const getAiBadge = (task) => {
    if (task.effort <= 3 && task.score > 60) return { label: 'Quick Win', color: 'var(--success)' };
    if (task.deadline && isPast(new Date(task.deadline))) return { label: 'Overdue', color: 'var(--danger)' };
    if (task.score > 130) return { label: 'Focus Now', color: 'var(--accent)' };
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem('active-user');
    setCurrentUser(null);
  };

  const addStaffMember = (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.username || !newStaff.password || !newStaff.email) {
      alert("All fields are required");
      return;
    }
    const staff = {
      ...newStaff,
      id: 'S' + Date.now(),
      role: 'Staff'
    };

    setStaffMembers([...staffMembers, staff]);
    setNewStaff({ name: '', username: '', password: '', email: '' });
  };

  const removeStaffMember = (id) => {
    if (window.confirm("Are you sure you want to remove this staff member?")) {
      setStaffMembers(staffMembers.filter(s => s.id !== id));
    }
  };


  if (!currentUser) {
    return (
      <div className="login-overlay">
        <div className="login-bg-elements">
          <div className="login-blob blob-1"></div>
          <div className="login-blob blob-2"></div>
          <div className="login-blob blob-3"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="login-card glass-panel"
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div className="avatar-glow">
              <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', border: '2px solid var(--primary)', background: 'rgba(255,255,255,0.05)' }}>
                <Brain size={40} className="glow-icon" />
              </div>
            </div>
          </div>

          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px', letterSpacing: '-0.02em' }}>TaskPilot</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '0.95rem' }}>Strategic Operations Login</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>Identifier</label>
              <div className="input-with-icon">
                <Users size={18} className="field-icon" style={{ opacity: 0.5 }} />
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={loginData.username}
                  onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>Access Key</label>
              <div className="input-with-icon">
                <ShieldCheck size={18} className="field-icon" style={{ opacity: 0.5 }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={loginData.password}
                  onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}
              >
                <AlertCircle size={14} /> {loginError}
              </motion.div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px', height: '52px', fontSize: '1.1rem' }}>
              Authorize Access <ArrowRight size={20} />
            </button>
          </form>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '8px' }}>Security Protocol: v4.1 Active</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', opacity: 0.7 }}>
              <span>Manager: admin/123</span>
              <span>•</span>
              <span>Staff: adam/111</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="logo-section">
          <div className="logo-icon">
            <Network size={24} color="#fff" />
          </div>
          <h2>TASKPILOT</h2>
        </div>

        <nav>
          <div className="sidebar-section-title" style={{ marginTop: 0 }}>Main Menu</div>
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            <Brain size={20} /> Dashboard
          </button>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
            <Clock size={20} /> Pending
          </button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>
            <CheckCircle2 size={20} /> Completed
          </button>
        </nav>

        {currentUser.role === 'Manager' && (
          <>
            <div className="sidebar-section-title">Team Workload</div>
            <div className="stats-card">
              {staffMembers.map(staff => {
                const staffTasks = tasks.filter(t =>
                  Array.isArray(t.assignees)
                    ? t.assignees.some(a => a.email === staff.email)
                    : t.email === staff.email
                ).filter(t => !t.completed).length;

                return (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaffDetails(staff)}
                    className="staff-link"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      color: 'inherit',
                      padding: '8px 12px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <span>{staff.name.split(' ')[0]}</span>
                    <span style={{
                      color: staffTasks > 3 ? 'var(--danger)' : staffTasks > 0 ? 'var(--accent)' : 'var(--text-muted)',
                      fontWeight: '700'
                    }}>
                      {staffTasks} {staffTasks === 1 ? 'task' : 'tasks'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="sidebar-section-title">Manage System</div>
            <div className="stats-card">
              <div className="stat-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Company Progress</span>
                <span style={{ fontWeight: '700' }}>{Math.round((tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100)}%</span>
              </div>
              <div className="progress-bar-bg" style={{ marginTop: '8px' }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="api-settings-card">
              <label><Smartphone size={14} /> WhatsApp Gateway</label>
              <div className="api-input-group">
                <input
                  type="password"
                  placeholder="CallMeBot Key"
                  value={botApiKey}
                  onChange={(e) => setBotApiKey(e.target.value)}
                />
                <button className="test-api-btn" onClick={testBotConnection}>
                  <Send size={14} />
                </button>
              </div>
            </div>

            <div className="api-settings-card n8n-card">
              <label><Zap size={14} /> n8n Automation</label>
              <div className="api-input-group">
                <input
                  type="text"
                  placeholder="Webhook URL"
                  value={n8nUrl}
                  onChange={(e) => setN8nUrl(e.target.value)}
                />
                <button
                  className="test-api-btn"
                  onClick={testN8nConnection}
                  style={{ backgroundColor: '#ff6d5a', borderColor: '#ff6d5a' }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setIsStaffModalOpen(true)}
            >
              <Users size={18} /> Manage Team
            </button>
          </>

        )}

        <div style={{ flex: 1 }}></div>

        <div className="user-profile">
          <div className="avatar" style={{ border: '2px solid var(--primary)' }}>
            {currentUser.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{currentUser.role}</div>
          </div>
          <button
            className="logout-btn"
            style={{ background: 'transparent', border: 'none' }}
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="search-bar glass-panel">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search tasks or AI insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="header-actions">
            <div className="advanced-filters glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginRight: '4px' }}>
                <Filter size={14} /> FILTER:
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {currentUser.role === 'Manager' && (
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="all">Entire Team</option>
                  <option value="admin@aisync.com">Manager (Self)</option>
                  {staffMembers.map(s => (
                    <option key={s.id} value={s.email}>{s.name.split(' ')[0]}</option>
                  ))}

                </select>
              )}
            </div>

            <button className="icon-btn glass-panel"><Bell size={20} /></button>
            {currentUser.role === 'Manager' && (
              <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ whiteSpace: 'nowrap' }}>
                <Plus size={20} /> New Task
              </button>
            )}
          </div>
        </header>

        <section className="dashboard">
          {currentUser.role === 'Manager' && (
            <div className="stats-overview-grid">
              <div className="stat-card-premium glass-panel">
                <div className="stat-icon-wrapper blue">
                  <ShieldCheck size={24} />
                </div>
                <div className="stat-details">
                  <span className="stat-value">{tasks.length}</span>
                  <span className="stat-label">Total Missions</span>
                </div>
              </div>
              <div className="stat-card-premium glass-panel">
                <div className="stat-icon-wrapper orange">
                  <Clock size={24} />
                </div>
                <div className="stat-details">
                  <span className="stat-value">{tasks.filter(t => !t.completed).length}</span>
                  <span className="stat-label">Active Tasks</span>
                </div>
              </div>
              <div className="stat-card-premium glass-panel">
                <div className="stat-icon-wrapper green">
                  <CheckCircle2 size={24} />
                </div>
                <div className="stat-details">
                  <span className="stat-value">{tasks.filter(t => t.completed).length}</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>
              <div className="stat-card-premium glass-panel">
                <div className="stat-icon-wrapper purple">
                  <Zap size={24} />
                </div>
                <div className="stat-details">
                  <span className="stat-value">{Math.round(tasks.reduce((acc, t) => acc + (t.score || 0), 0) / (tasks.length || 1))}</span>
                  <span className="stat-label">Avg AI Score</span>
                </div>
              </div>
            </div>
          )}

          <div className="section-header" style={{ marginTop: '32px', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ width: '100%' }}>
              <h1 className="text-gradient" style={{ fontSize: '2.4rem', letterSpacing: '-0.03em' }}>Task List</h1>
            </div>

            {notifications.filter(n => currentUser.role === 'Staff' && n.assignees?.includes(currentUser.email)).length > 0 && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="intelligence-alert glass-panel"
                style={{ width: '100%' }}
              >
                <div className="alert-glow"></div>
                <div className="alert-content">
                  <div className="alert-icon bounce">
                    <Zap size={20} />
                  </div>
                  <div className="alert-text">
                    <span className="alert-title">Intelligence Alert</span>
                    <span className="alert-msg">
                      {notifications.filter(n => currentUser.role === 'Staff' && n.assignees?.includes(currentUser.email))[0].message}
                    </span>
                  </div>
                  <button className="alert-dismiss" onClick={() => {
                    const filtered = notifications.filter(n => currentUser.role === 'Staff' && n.assignees?.includes(currentUser.email));
                    if (filtered.length > 0) {
                      const idToDismiss = filtered[0].id;
                      setNotifications(prev => prev.filter(n => n.id !== idToDismiss));
                    }
                  }}>
                    Acknowledge
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="task-grid">
            <AnimatePresence mode="popLayout">
              {filteredTasks.length === 0 ? (
                <div className="empty-state glass-panel">
                  <Brain size={48} color="var(--text-muted)" />
                  <h3>No Active Missions</h3>
                  <p>All clear! Or try adjusting your filters.</p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const priority = task.priority ? PRIORITY_LEVELS[task.priority] : getPriorityInfo(task.score);
                  const aiBadge = getAiBadge(task);
                  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !task.completed;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={task.id}
                      className={`task-card glass-panel ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue-pulse' : ''}`}
                    >
                      <div className="task-header">
                        <div className="status-badge-container">
                          <div
                            className="priority-indicator"
                            style={{ backgroundColor: priority.color }}
                          ></div>
                          <span className="priority-label" style={{ color: priority.color }}>
                            {priority.label}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div className={`status-pill ${task.status?.toLowerCase().replace(' ', '-') || 'not-started'}`}>
                            {task.status || 'Not Started'}
                          </div>
                          {task.completed && task.perfStatus && (
                            <div className={`perf-pill ${task.perfStatus.toLowerCase()}`}>
                              {task.perfStatus}
                            </div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setTaskToDelete(task); }} className="action-icon-btn delete" title="Purge Data">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h3 className="task-title" style={{ cursor: 'default' }}>{task.title}</h3>
                      <p className="task-desc">{task.description}</p>

                      <div className="task-card-body">
                        <div className="assignee-row">
                          <div className="avatar-group">
                            {Array.isArray(task.assignees) ? task.assignees.slice(0, 3).map((a, idx) => (
                              <span key={idx} className="avatar-sm" title={a.name}>
                                {a.name[0].toUpperCase()}
                              </span>
                            )) : (
                              <span className="avatar-sm">{(task.assignee || 'S')[0].toUpperCase()}</span>
                            )}
                            {Array.isArray(task.assignees) && task.assignees.length > 3 && (
                              <span className="avatar-sm extra">+{task.assignees.length - 3}</span>
                            )}
                          </div>
                          <span className="assignee-names">
                            {Array.isArray(task.assignees)
                              ? task.assignees.map(a => a.name.split(' ')[0]).join(', ')
                              : (task.assignee || 'Self')}
                          </span>
                        </div>

                        <div className="task-actions-row">
                          {task.phone && (
                            <button className="action-icon-btn whatsapp" onClick={() => sendWhatsApp(task)}>
                              <MessageCircle size={14} />
                            </button>
                          )}
                          <button className="action-icon-btn n8n" onClick={() => triggerN8nManual(task)} disabled={isSending}>
                            <Zap size={14} />
                          </button>

                          <div style={{ flex: 1 }}></div>

                          {!task.completed ? (
                            <>
                              {task.status === 'Not Started' ? (
                                <button className="btn-task-action start" onClick={() => startTask(task.id)}>
                                  <Clock size={14} /> Start
                                </button>
                              ) : (
                                <button className="btn-task-action complete" onClick={() => completeTask(task.id)}>
                                  <CheckCircle2 size={14} /> Finish
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="completed-timestamp">
                              <ShieldCheck size={12} /> {task.completedTime ? format(new Date(task.completedTime), 'HH:mm') : '--:--'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="task-footer-v2">
                        <div className="meta-item">
                          <Calendar size={12} />
                          <span>{task.deadline ? format(new Date(task.deadline), 'MMM d, HH:mm') : 'No Deadline'}</span>
                        </div>
                        <div className="meta-item">
                          <Target size={12} />
                          <span>AI:{Math.round(task.score)}</span>
                        </div>
                      </div>

                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </section>
      </main >


      {/* Modal */}
      < AnimatePresence >
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="modal-content glass-panel"
            >
              <div className="modal-header">
                <div>
                  <h2 className="text-gradient" style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <Plus size={28} color="var(--primary)" /> Add Task
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Add Task</p>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={addTask} style={{ marginTop: '32px' }}>
                <div className="form-section">
                  <div className="section-label"><Brain size={14} /></div>
                  <div className="form-group">
                    <label>Task Objective</label>
                    <input
                      autoFocus
                      required
                      type="text"
                      placeholder="e.g. Deploy Production Server"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className={formErrors.title ? 'error' : ''}
                    />
                    {formErrors.title && <span className="error-text">{formErrors.title}</span>}
                  </div>

                  <div className="form-group">
                    <label>Detailed Briefing</label>
                    <textarea
                      rows="3"
                      placeholder="Specify mission parameters..."
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-section">
                    <div className="section-label"><Users size={14} /> PERSONNEL</div>
                    <div className="form-group dropdown-container">
                      <label>Assigned Operatives</label>
                      <button
                        type="button"
                        className="dropdown-trigger glass-panel"
                        onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                      >
                        {newTask.assignees.length > 0
                          ? `${newTask.assignees.length} members selected`
                          : "Select Team Members"}
                        <MoreVertical size={16} />
                      </button>

                      {showAssigneeDropdown && (
                        <div className="dropdown-menu glass-panel">
                          <label className="dropdown-item">
                            <input
                              type="checkbox"
                              checked={newTask.assignees.some(a => a.email === 'admin@aisync.com')}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                const currentAssignees = [...newTask.assignees];
                                if (isChecked) {
                                  currentAssignees.push({ name: 'Manager (Self)', email: 'admin@aisync.com' });
                                } else {
                                  const index = currentAssignees.findIndex(a => a.email === 'admin@aisync.com');
                                  if (index > -1) currentAssignees.splice(index, 1);
                                }
                                setNewTask({ ...newTask, assignees: currentAssignees });
                              }}
                            />
                            <span>Manager (Self)</span>
                          </label>
                          {staffMembers.map(staff => (
                            <label key={staff.id} className="dropdown-item">
                              <input
                                type="checkbox"
                                checked={newTask.assignees.some(a => a.email === staff.email)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  const currentAssignees = [...newTask.assignees];
                                  if (isChecked) {
                                    currentAssignees.push({ name: staff.name, email: staff.email });
                                  } else {
                                    const index = currentAssignees.findIndex(a => a.email === staff.email);
                                    if (index > -1) currentAssignees.splice(index, 1);
                                  }
                                  setNewTask({ ...newTask, assignees: currentAssignees });
                                }}
                              />
                              <span>{staff.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {formErrors.assignee && <span className="error-text">{formErrors.assignee}</span>}
                    </div>

                    <div className="form-group">
                      <label>WhatsApp Alert Number</label>
                      <div className="input-with-icon">
                        <Smartphone size={16} className="field-icon" />
                        <input
                          type="tel"
                          placeholder="+1..."
                          value={newTask.phone}
                          onChange={(e) => setNewTask({ ...newTask, phone: e.target.value })}
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="section-label"><Calendar size={14} /> TIMELINE & ALERTS</div>
                    <div className="form-group">
                      <label>Final Deadline (Date & Time)</label>
                      <div className="input-with-icon">
                        <Clock size={16} className="field-icon" />
                        <input
                          type="datetime-local"
                          value={newTask.deadline}
                          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                          style={{ paddingLeft: '44px' }}
                          className={formErrors.deadline ? 'error' : ''}
                        />
                      </div>
                      {formErrors.deadline && <span className="error-text">{formErrors.deadline}</span>}
                    </div>

                    <div className="form-group">
                      <label>AI Reminder Signal</label>
                      <select
                        value={newTask.reminderOffset}
                        onChange={(e) => setNewTask({ ...newTask, reminderOffset: parseInt(e.target.value) })}
                        style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px' }}
                      >
                        <option value="5">5 Minutes Before</option>
                        <option value="10">10 Minutes Before</option>
                        <option value="30">30 Minutes Before</option>
                        <option value="60">1 Hour Before</option>
                        <option value="0">At Deadline</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="section-label"><Target size={14} /> PRIORITY</div>
                  <div className="form-group">
                    <label>Priority Level</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '8px' }}>
                      {Object.keys(PRIORITY_LEVELS).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setNewTask({ ...newTask, priority: level })}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: newTask.priority === level ? PRIORITY_LEVELS[level].color : 'rgba(255,255,255,0.1)',
                            background: newTask.priority === level ? `${PRIORITY_LEVELS[level].color}22` : 'rgba(0,0,0,0.2)',
                            color: newTask.priority === level ? PRIORITY_LEVELS[level].color : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {PRIORITY_LEVELS[level].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '32px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Close</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                    Submit <ArrowRight size={20} />
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence >

      {/* Staff Details Popup for Manager */}
      <AnimatePresence>
        {selectedStaffDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{ zIndex: 2001 }}
            onClick={() => setSelectedStaffDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content glass-panel"
              style={{ maxWidth: '600px', width: '90%' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                    {selectedStaffDetails.name[0]}
                  </div>
                  <div>
                    <h2 style={{ marginBottom: '4px' }}>{selectedStaffDetails.name}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedStaffDetails.email}</p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedStaffDetails(null)}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                <div className="form-group">
                  <label>Active Workload</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>
                      {tasks.filter(t => (Array.isArray(t.assignees) ? t.assignees.some(a => a.email === selectedStaffDetails.email) : t.email === selectedStaffDetails.email) && !t.completed).length} Tasks
                    </span>
                  </div>
                </div>

                {tasks.filter(t => Array.isArray(t.assignees) ? t.assignees.some(a => a.email === selectedStaffDetails.email) : t.email === selectedStaffDetails.email).length === 0 ?
                  <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No tasks assigned yet.</p>
                  :
                  tasks.filter(t => Array.isArray(t.assignees) ? t.assignees.some(a => a.email === selectedStaffDetails.email) : t.email === selectedStaffDetails.email).map(task => (
                    <div key={task.id} style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 'bold', textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-muted)' : '#fff' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Due: {task.deadline || 'No date'}
                        </div>
                      </div>
                      <div className="status-badge-container" style={{ gap: '8px' }}>
                        <div className={`status-pill ${task.status?.toLowerCase().replace(' ', '-') || 'not-started'}`} style={{ padding: '2px 8px' }}>
                          {task.status || 'Pending'}
                        </div>
                        {task.completed && task.perfStatus && (
                          <div className={`perf-pill ${task.perfStatus.toLowerCase()}`}>
                            {task.perfStatus}
                          </div>
                        )}
                      </div>

                    </div>
                  ))
                }

              </div>
            </motion.div>
          </motion.div>
        )}


      </AnimatePresence>

      {/* Team Management Modal */}
      <AnimatePresence>
        {isStaffModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{ zIndex: 2005 }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="modal-content glass-panel"
              style={{ maxWidth: '800px' }}
            >
              <div className="modal-header">
                <div>
                  <h2 className="text-gradient" style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={28} color="var(--primary)" /> Team Management
                  </h2>
                  <p style={{ color: 'var(--text-muted)' }}>Manage personnel access and credentials</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsStaffModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', marginTop: '32px' }}>
                <div>
                  <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Add New Member</h3>
                  <form onSubmit={addStaffMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="John Doe" required />
                    </div>
                    <div className="form-group">
                      <label>Username</label>
                      <input type="text" value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value })} placeholder="johndoe" required />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="john@example.com" required />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input type="text" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} placeholder="Set password" required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Add Member</button>
                  </form>
                </div>

                <div>
                  <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Current Staff ({staffMembers.length})</h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {staffMembers.map(staff => (
                      <div key={staff.id} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{staff.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{staff.username} • {staff.email}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--primary)22', padding: '2px 8px', borderRadius: '4px', height: 'fit-content' }}>
                            PW: {staff.password}
                          </div>
                          <button
                            onClick={() => removeStaffMember(staff.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {taskToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{ zIndex: 3000 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content glass-panel"
              style={{ maxWidth: '400px', textAlign: 'center' }}
            >
              <div style={{ color: 'var(--danger)', marginBottom: '20px' }}>
                <AlertCircle size={48} style={{ margin: '0 auto' }} />
              </div>
              <h2 style={{ marginBottom: '12px' }}>Confirm Deletion</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Are you sure you want to delete <strong>"{taskToDelete.title}"</strong>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setTaskToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={() => deleteTask(taskToDelete.id)}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >

  );
}

export default App;
