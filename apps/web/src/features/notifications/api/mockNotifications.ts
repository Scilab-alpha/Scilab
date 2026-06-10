import type { Notification } from "../types/notification.types";

export const mockNotifications: Notification[] = [
  {
    id: "1",
    category: "publication",
    title: "New Publication in Machine Learning",
    description:
      "A new article matching your interests has been published: 'Advances in Neural Network Architecture Design'",
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
    description:
      "Your bookmarked article 'Deep Learning for Protein Structure' has been cited 5 times",
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
