"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Bell,
  Check,
  ExternalLink,
  Circle,
  BookOpenCheck,
  Sparkles,
  FileCheck,
  Settings,
  Mail,
  Calendar,
  X as XIcon,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";

interface Notification {
  id: string;
  category: "journal" | "topic" | "publication" | "system";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  relatedId?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    category: "publication",
    title: "New Publication in Machine Learning",
    description: "A new article matching your interests has been published: 'Advances in Neural Network Architecture Design'",
    timestamp: "2024-06-08T10:30:00",
    isRead: false,
  },
  {
    id: "2",
    category: "journal",
    title: "Nature Machine Intelligence - New Issue",
    description: "Volume 6, Issue 7 is now available with 24 new articles",
    timestamp: "2024-06-08T09:15:00",
    isRead: false,
  },
  {
    id: "3",
    category: "topic",
    title: "Trending: AI Safety & Alignment",
    description: "This topic has seen a 156% increase in publications this month",
    timestamp: "2024-06-08T08:00:00",
    isRead: false,
  },
  {
    id: "4",
    category: "publication",
    title: "Citation Alert",
    description: "Your bookmarked article 'Deep Learning for Protein Structure' has been cited 5 times",
    timestamp: "2024-06-07T16:45:00",
    isRead: true,
  },
  {
    id: "5",
    category: "journal",
    title: "Science - Special Issue Alert",
    description: "Special issue on Climate Science and Machine Learning is now available",
    timestamp: "2024-06-07T14:20:00",
    isRead: true,
  },
  {
    id: "6",
    category: "topic",
    title: "CRISPR Technology Updates",
    description: "12 new articles published in your followed topic this week",
    timestamp: "2024-06-07T11:30:00",
    isRead: true,
  },
  {
    id: "7",
    category: "system",
    title: "Weekly Digest Ready",
    description: "Your personalized weekly research digest for June 1-7 is ready to view",
    timestamp: "2024-06-07T09:00:00",
    isRead: true,
  },
  {
    id: "8",
    category: "publication",
    title: "Recommended for You",
    description: "Based on your interests: 'Quantum Computing Applications in Drug Discovery'",
    timestamp: "2024-06-06T15:10:00",
    isRead: true,
  },
  {
    id: "9",
    category: "system",
    title: "Profile Verification Complete",
    description: "Your academic profile has been verified successfully",
    timestamp: "2024-06-06T10:00:00",
    isRead: true,
  },
];

export default function NotificationCenter() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [notifications, setNotifications] = useState(mockNotifications);
  const [notificationPreference, setNotificationPreference] = useState("daily");

  const categories = [
    { id: "all", label: "All Notifications", icon: Bell },
    { id: "journal", label: "Followed Journals", icon: BookOpenCheck },
    { id: "topic", label: "Followed Topics", icon: Sparkles },
    { id: "publication", label: "New Publications", icon: FileCheck },
    { id: "system", label: "System", icon: Settings },
  ];

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, isRead: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return then.toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "journal":
        return BookOpenCheck;
      case "topic":
        return Sparkles;
      case "publication":
        return FileCheck;
      case "system":
        return Settings;
      default:
        return Bell;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "journal":
        return { bg: "bg-accent", text: "text-tag", icon: "text-primary" };
      case "topic":
        return { bg: "bg-accent", text: "text-tag", icon: "text-primary" };
      case "publication":
        return { bg: "bg-green-50", text: "text-green-700", icon: "text-teal" };
      case "system":
        return { bg: "bg-surface-raised", text: "text-muted-foreground", icon: "text-muted-foreground" };
      default:
        return { bg: "bg-accent", text: "text-tag", icon: "text-primary" };
    }
  };

  const filteredNotifications =
    selectedCategory === "all"
      ? notifications
      : notifications.filter((n) => n.category === selectedCategory);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <Bell className="w-5 h-5 text-white" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h1 className="font-heading text-lg text-foreground truncate">Notifications</h1>
                <p className="text-xs text-muted-foreground truncate">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/student/notifications"
              className="relative p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>

            <Link
              href="/student/profile"
              className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium text-tag">JS</span>
            </Link>
          </div>
        </header>

      <main className="flex-1 overflow-auto">
          <div className="flex h-full">
            {/* Notification Feed */}
            <div className="flex-1 p-8 overflow-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Actions Bar */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isActive = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            isActive
                              ? "bg-primary text-white shadow-sm"
                              : "bg-card text-muted-foreground hover:bg-accent border border-border"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden lg:inline">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={handleMarkAllAsRead}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark All Read
                    </Button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="space-y-2">
                  {filteredNotifications.length === 0 ? (
                    <Card className="p-12 border-border bg-card">
                      <div className="text-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-heading text-lg text-foreground mb-2">No notifications</h3>
                        <p className="text-sm text-muted-foreground">
                          You're all caught up! Check back later for new updates.
                        </p>
                      </div>
                    </Card>
                  ) : (
                    filteredNotifications.map((notification) => {
                      const Icon = getCategoryIcon(notification.category);
                      const colors = getCategoryColor(notification.category);

                      return (
                        <Card
                          key={notification.id}
                          className={`p-5 border-border hover:border-border transition-all ${
                            notification.isRead ? "bg-card" : "bg-accent/50 border-l-4 border-l-primary"
                          }`}
                        >
                          <div className="flex gap-4">
                            {/* Icon */}
                            <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-5 h-5 ${colors.icon}`} strokeWidth={1.75} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                  {notification.title}
                                  {!notification.isRead && (
                                    <Circle className="w-2 h-2 fill-primary text-primary flex-shrink-0" />
                                  )}
                                </h3>
                                <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                                  {getTimeAgo(notification.timestamp)}
                                </span>
                              </div>

                              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                {notification.description}
                              </p>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                {!notification.isRead && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Mark as read
                                  </button>
                                )}
                                <button className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  View details
                                </button>
                                <button
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  className="text-xs text-muted-foreground hover:text-red-600 font-medium flex items-center gap-1 ml-auto"
                                >
                                  <XIcon className="w-3.5 h-3.5" />
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Preferences Sidebar */}
            <aside className="w-80 bg-card border-l border-border p-6 overflow-auto">
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose how you want to receive updates
                  </p>
                </div>

                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      notificationPreference === "in-app"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="notifications"
                      value="in-app"
                      checked={notificationPreference === "in-app"}
                      onChange={(e) => setNotificationPreference(e.target.value)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground">In-App Only</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications only within ScholarTrend
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      notificationPreference === "daily"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="notifications"
                      value="daily"
                      checked={notificationPreference === "daily"}
                      onChange={(e) => setNotificationPreference(e.target.value)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground">Daily Email</p>
                        <span className="px-1.5 py-0.5 bg-accent text-tag text-xs font-semibold rounded flex-shrink-0">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get a daily digest of important updates
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      notificationPreference === "weekly"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="notifications"
                      value="weekly"
                      checked={notificationPreference === "weekly"}
                      onChange={(e) => setNotificationPreference(e.target.value)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground">Weekly Email</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Receive a weekly summary every Monday
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      notificationPreference === "disabled"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="notifications"
                      value="disabled"
                      checked={notificationPreference === "disabled"}
                      onChange={(e) => setNotificationPreference(e.target.value)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <XIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground">Disable All</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Turn off all notification emails
                      </p>
                    </div>
                  </label>
                </div>

                <Button className="w-full h-10">
                  <Check className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>

                {/* Stats */}
                <Card className="p-4 border-border bg-background">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Activity Summary</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Unread</span>
                      <span className="font-semibold text-foreground">{unreadCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold text-foreground">{notifications.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">This Week</span>
                      <span className="font-semibold text-foreground">
                        {notifications.filter((n) => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(n.timestamp) > weekAgo;
                        }).length}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </aside>
          </div>
      </main>
    </>
  );
}
