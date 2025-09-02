import * as React from "react";
import { Button } from "../../components/ui/button";

interface ActionButtonsProps {
  onSaveSession: () => void
  onNewSession: () => void
  isLoading?: boolean
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSaveSession,
  onNewSession,
  isLoading = false
}) => {
  return (
    <div className="flex flex-col gap-2 mb-5">
      <Button 
        onClick={onSaveSession}
        disabled={isLoading}
        className="btn btn-primary py-3"
      >
        Save Current Session
      </Button>
      <Button 
        onClick={onNewSession}
        variant="secondary"
        disabled={isLoading}
        className="btn btn-secondary py-3"
      >
        New Session
      </Button>
    </div>
  );
};
