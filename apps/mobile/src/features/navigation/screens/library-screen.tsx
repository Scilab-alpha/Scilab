import { useState } from "react";

import { AppSegmentedControl } from "@/components/ui";
import { SavedBookmarksList } from "@/features/bookmarks/components/saved-bookmarks-list";
import { FollowingList } from "@/features/follows/components/following-list";
import { ScreenShell } from "@/features/navigation/components/screen-shell";

type LibraryMode = "saved" | "following";

export function LibraryScreen() {
  const [mode, setMode] = useState<LibraryMode>("saved");

  return (
    <ScreenShell
      showHeader={false}
      subtitle="Your saved works and followed research signals."
      title="Library"
    >
      <AppSegmentedControl
        label="Library view"
        onChange={setMode}
        options={[
          { label: "Saved", value: "saved" },
          { label: "Following", value: "following" },
        ]}
        value={mode}
      />
      {mode === "saved" ? (
        <SavedBookmarksList />
      ) : (
        <FollowingList />
      )}
    </ScreenShell>
  );
}
