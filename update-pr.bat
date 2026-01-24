@echo off
REM Update GitHub PR #12 with better title and description

gh pr edit 12 --title "Add environment variable management with Zod validation (Vibe Kanban)" --body-file pr-description.md

if %errorlevel% equ 0 (
    echo.
    echo ✅ PR #12 has been successfully updated!
    echo.
    echo View the PR at: https://github.com/marmoure/subscription_manager/pull/12
) else (
    echo.
    echo ❌ Failed to update PR. Make sure GitHub CLI is installed and you're authenticated.
    echo.
    echo Install GitHub CLI: https://cli.github.com/
    echo Authenticate: gh auth login
)

pause
