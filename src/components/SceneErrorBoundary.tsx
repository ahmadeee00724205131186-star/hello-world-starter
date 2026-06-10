import React from "react";

type Props = { children: React.ReactNode; onReset?: () => void };
type State = { hasError: boolean; key: number };

export class SceneErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, key: 0 };
  private retryTimer: number | null = null;

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.warn("[SceneErrorBoundary] caught:", error);
    // Auto-recover from transient WebGL context loss / postprocessing init races.
    if (this.retryTimer) window.clearTimeout(this.retryTimer);
    this.retryTimer = window.setTimeout(() => {
      this.setState((s) => ({ hasError: false, key: s.key + 1 }));
      this.props.onReset?.();
    }, 350);
  }

  componentWillUnmount() {
    if (this.retryTimer) window.clearTimeout(this.retryTimer);
  }

  handleManualRetry = () => {
    if (this.retryTimer) window.clearTimeout(this.retryTimer);
    this.setState((s) => ({ hasError: false, key: s.key + 1 }));
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#0a0612",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,220,160,0.85)",
            fontFamily: "serif",
          }}
        >
          <button
            onClick={this.handleManualRetry}
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              background: "rgba(255,180,90,0.12)",
              border: "1px solid rgba(255,180,90,0.4)",
              color: "inherit",
              cursor: "pointer",
              fontSize: 14,
              letterSpacing: "0.15em",
            }}
          >
            ✨ Rekindle the Magic ✨
          </button>
        </div>
      );
    }
    return (
      <React.Fragment key={this.state.key}>{this.props.children}</React.Fragment>
    );
  }
}
