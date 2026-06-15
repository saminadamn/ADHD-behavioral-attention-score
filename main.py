"""Entry point for the ADHD-BAS multi-agent pipeline."""
import os
import sys

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))

from models.state import PipelineState
from graphs.pipeline import build_pipeline


def main() -> None:
    print("=" * 60)
    print("  ADHD-BAS  |  Attentional Variability Research Prototype")
    print("=" * 60)

    pipeline = build_pipeline()
    initial_state = PipelineState()

    # LangGraph 1.x returns a dict of the final state values
    result: dict = pipeline.invoke(initial_state)

    if result.get("error"):
        print(f"\n[ERROR] {result['error']}")
        sys.exit(1)

    print("\n" + result.get("report", "(no report generated)"))
    print("\n[Done] Check outputs/ for visualisation plots.")


if __name__ == "__main__":
    main()
