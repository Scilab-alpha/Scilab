"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Upload,
  Camera,
  Check,
  X,
  Eye,
  EyeOff,
  Monitor,
  MapPin,
  Calendar,
  Shield,
  Mail,
  Globe,
  Bell,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import { Label } from "@/shared/components/ui/label";
import { getUserProfile } from "@/features/auth/api/auth.api";
import { ROLE_LABELS } from "@/shared/constants/permissions";

export default function ProfileManagement() {
  const profileQuery = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: getUserProfile,
    retry: 1,
  });
  const [activeTab, setActiveTab] = useState("personal");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notificationPreference, setNotificationPreference] = useState("daily");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("OTHER");
  const [profileNotice, setProfileNotice] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sessions: Array<{
    device: string;
    location: string;
    ip: string;
    lastActive: string;
    current: boolean;
  }> = [];

  useEffect(() => {
    if (!profileQuery.data) return;
    setFirstName(profileQuery.data.firstName ?? "");
    setLastName(profileQuery.data.lastName ?? "");
    setDateOfBirth(profileQuery.data.dateOfBirth?.slice(0, 10) ?? "");
    setGender(profileQuery.data.gender ?? "OTHER");
  }, [profileQuery.data]);

  const handleSavePersonalInfo = () => {
    setProfileNotice("Profile editing is not available yet.");
  };

  const handleChangePassword = () => {
    setProfileNotice("Password changes are not available yet.");
  };

  const handleDisconnectGoogle = () => {
    setProfileNotice("Connected account changes are not available yet.");
  };

  const handleRevokeSession = (index: number) => {
    setProfileNotice(`Session ${index + 1} cannot be revoked here yet.`);
  };

  if (profileQuery.isPending) {
    return <ProfileState message="Loading your profile..." />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ProfileState
        message="We could not load your profile."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data;

  return (
    <>
      <StudentTopHeader searchPlaceholder="Search articles, journals, topics..." />

      <main className="flex-1 overflow-auto bg-card">
        <PageContainer size="narrow" className="py-12">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 bg-primary rounded-[var(--radius-card)] flex items-center justify-center">
                  <span className="font-heading text-3xl text-primary-foreground">
                    {profile.initials}
                  </span>
                </div>
                <button className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="min-w-0">
                    <h1 className="font-heading text-3xl text-foreground mb-1">
                      {profile.displayName}
                    </h1>
                    <p className="text-base text-muted-foreground mb-3">
                      {profile.email}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-accent text-tag text-sm font-semibold rounded-lg border border-border">
                        {ROLE_LABELS[profile.role]}
                      </span>
                      <span className="px-3 py-1 bg-teal/10 text-teal text-sm font-semibold rounded-lg border border-border">
                        {profile.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border mb-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("personal")}
                className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === "personal"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Personal Information
                {activeTab === "personal" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("account")}
                className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === "account"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Account Settings
                {activeTab === "account" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === "notifications"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Notification Preferences
                {activeTab === "notifications" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <Card className="p-6 border-border">
                <h2 className="font-heading text-lg text-foreground mb-6">
                  Basic Information
                </h2>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="first-name"
                        className="text-sm font-medium"
                      >
                        First Name
                      </Label>
                      <Input
                        id="first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="last-name"
                        className="text-sm font-medium"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="text-sm font-medium">
                        Date of Birth
                      </Label>
                      <Input
                        id="dob"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-medium">
                        Gender
                      </Label>
                      <select
                        id="gender"
                        className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border">
                <h2 className="font-heading text-lg text-foreground mb-6">
                  Profile Picture
                </h2>

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-primary rounded-[var(--radius-card)] flex items-center justify-center">
                    <span className="font-heading text-2xl text-primary-foreground">
                      {profile.initials}
                    </span>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload a new profile picture. Recommended size: 400x400px.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" className="h-9">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" size="sm" className="h-10 px-4">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-10 px-4"
                  onClick={handleSavePersonalInfo}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <p className="sr-only" aria-live="polite">
                  {profileNotice}
                </p>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <Card className="p-6 border-border">
                <h2 className="font-heading text-lg text-foreground mb-6">
                  Change Password
                </h2>

                <div className="space-y-5 max-w-xl">
                  <div className="space-y-2">
                    <Label
                      htmlFor="current-password"
                      className="text-sm font-medium"
                    >
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="new-password"
                      className="text-sm font-medium"
                    >
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirm-password"
                      className="text-sm font-medium"
                    >
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="h-10"
                    onClick={handleChangePassword}
                  >
                    Update Password
                  </Button>
                </div>
              </Card>

              <Card className="p-6 border-border">
                <h2 className="font-heading text-lg text-foreground mb-6">
                  Connected Accounts
                </h2>

                <div className="max-w-xl">
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Google Account
                        </p>
                        <p className="text-xs text-muted-foreground">
                          jane.smith@gmail.com
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                      onClick={handleDisconnectGoogle}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border">
                <h2 className="font-heading text-lg text-foreground mb-6">
                  Active Sessions
                </h2>

                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Active session details are not available yet.
                    </p>
                  ) : null}
                  {sessions.map((session, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border flex-shrink-0">
                          {session.device.includes("Chrome") ? (
                            <Globe className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Monitor className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {session.device}
                            </p>
                            {session.current && (
                              <span className="px-2 py-0.5 bg-teal/10 text-teal text-xs font-semibold rounded flex-shrink-0">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {session.ip}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {session.lastActive}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-4"
                          onClick={() => handleRevokeSession(index)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <Card className="p-6 border-border">
                <h2 className="font-heading text-lg text-foreground mb-2">
                  Email Notifications
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose how you want to receive notifications about new
                  publications, trends, and updates.
                </p>

                <div className="space-y-3 max-w-2xl">
                  <label
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
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
                      onChange={(e) =>
                        setNotificationPreference(e.target.value)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground">
                          In-App Only
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications only within the Scilab
                        application. No emails will be sent.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
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
                      onChange={(e) =>
                        setNotificationPreference(e.target.value)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground">
                          Daily Email Digest
                        </p>
                        <span className="px-2 py-0.5 bg-accent text-tag text-xs font-semibold rounded flex-shrink-0">
                          Recommended
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Get a daily summary of new publications, trending
                        topics, and personalized recommendations.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
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
                      onChange={(e) =>
                        setNotificationPreference(e.target.value)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground">
                          Weekly Email Digest
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly roundup every Monday with highlights
                        from the past week.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
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
                      onChange={(e) =>
                        setNotificationPreference(e.target.value)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground">
                          Disable Notifications
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Turn off all notifications. You can still check updates
                        manually in the app.
                      </p>
                    </div>
                  </label>
                </div>
              </Card>

              <Card className="p-6 border-border bg-accent border-border">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-tag" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-sm text-foreground mb-1">
                      Notification Categories
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      You&apos;ll receive notifications for the following events
                      based on your selected preference:
                    </p>
                    <ul className="text-sm text-tag space-y-1 list-disc list-inside">
                      <li>New publications in your followed topics</li>
                      <li>Trending research areas in your field</li>
                      <li>Citations of bookmarked articles</li>
                      <li>Updates from followed journals</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" size="sm" className="h-10 px-4">
                  Cancel
                </Button>
                <Button size="sm" className="h-10 px-4">
                  <Check className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </PageContainer>
      </main>
    </>
  );
}

function ProfileState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-card px-6">
      <div className="space-y-4 text-center">
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
        {onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    </main>
  );
}
