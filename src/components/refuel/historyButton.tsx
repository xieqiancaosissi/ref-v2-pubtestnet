import React from "react";
import { useRouter } from "next/router";
import Button from "@/components/bridge/Button";
function HistoryButton() {
  const router = useRouter();
  function handleOpenHistory() {
    router.push("/bridge/history");
  }

  return (
    <div className="mt-4 flex items-center justify-between">
      <Button text onClick={handleOpenHistory}>
        Bridge Transaction History
      </Button>
    </div>
  );
}

export default React.memo(HistoryButton);
