import uvicorn


def main() -> None:
    """Entry point for the application."""
    uvicorn.run("app.server:app", host="0.0.0.0", port=8001, reload=True)


if __name__ == "__main__":
    main()
