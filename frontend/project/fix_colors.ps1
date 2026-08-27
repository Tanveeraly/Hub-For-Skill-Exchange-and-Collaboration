$files = @(
    "src\pages\SwapScheduling.tsx",
    "src\pages\Profile.tsx",
    "src\pages\CareerBooster.tsx",
    "src\components\WorkSessionModal.tsx",
    "src\components\VideoCall.tsx",
    "src\components\TermsAndConditionsModal.tsx",
    "src\components\SubmitProgressModal.tsx",
    "src\components\SkillModal.tsx",
    "src\components\RatingModal.tsx",
    "src\components\IncomingCallModal.tsx",
    "src\components\MeetingInvitationModal.tsx",
    "src\components\Collaboration.tsx"
)

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        # shadow-color patterns
        $content = $content -replace 'shadow-blue-', 'shadow-primary-'
        $content = $content -replace 'shadow-red-', 'shadow-error-'
        $content = $content -replace 'shadow-green-', 'shadow-success-'
        $content = $content -replace 'shadow-indigo-', 'shadow-primary-'
        $content = $content -replace 'shadow-purple-', 'shadow-accent-'
        $content = $content -replace 'shadow-yellow-', 'shadow-warning-'
        # via-color patterns
        $content = $content -replace 'via-indigo-', 'via-primary-'
        $content = $content -replace 'via-blue-', 'via-primary-'
        $content = $content -replace 'via-purple-', 'via-accent-'
        $content = $content -replace 'via-gray-', 'via-neutral-'
        $content = $content -replace 'via-cyan-', 'via-secondary-'
        # fill-color patterns
        $content = $content -replace 'fill-yellow-', 'fill-warning-'
        $content = $content -replace 'fill-red-', 'fill-error-'
        $content = $content -replace 'fill-blue-', 'fill-primary-'
        # accent-color (HTML accent attribute)
        $content = $content -replace 'accent-blue-', 'accent-primary-'
        # remaining bg-emerald
        $content = $content -replace 'bg-emerald-', 'bg-success-'
        $content = $content -replace 'border-emerald-', 'border-success-'
        $content = $content -replace 'text-emerald-', 'text-success-'
        # remaining pink
        $content = $content -replace 'bg-pink-', 'bg-error-'
        $content = $content -replace 'border-pink-', 'border-error-'
        $content = $content -replace 'text-pink-', 'text-error-'
        $content = $content -replace 'hover:border-pink-', 'hover:border-error-'
        # remaining from/to gray
        $content = $content -replace 'from-gray-', 'from-neutral-'
        $content = $content -replace 'to-gray-', 'to-neutral-'
        
        Set-Content $path $content -NoNewline
        Write-Host "Fixed: $file"
    }
}
Write-Host "Done! Second pass complete."
