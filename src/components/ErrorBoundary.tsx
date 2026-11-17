import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error.message, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="error-box" role="alert">
          <h1>Algo correu mal neste ecrã.</h1>
          <p>Recarrega a página para continuares a explorar a tabela.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
