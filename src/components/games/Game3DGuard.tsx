import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
};

class SceneErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Não foi possível iniciar a cena 3D", error, info);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function Game3DGuard({ children, fallback }: Props) {
  const [support, setSupport] = useState<"checking" | "ready" | "unsupported">("checking");

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      setSupport(gl ? "ready" : "unsupported");
    } catch {
      setSupport("unsupported");
    }
  }, []);

  if (support === "checking") {
    return (
      <div className="grid h-full min-h-[300px] place-items-center bg-secondary/60 text-sm font-bold text-muted-foreground">
        Preparando o cenário…
      </div>
    );
  }

  if (support === "unsupported") return fallback;
  return <SceneErrorBoundary fallback={fallback}>{children}</SceneErrorBoundary>;
}