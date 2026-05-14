# fix-app.ps1 - Insert Dashboard JS into talia-app.html
# Run with: powershell -ExecutionPolicy Bypass -File fix-app.ps1

$appFile  = 'C:\Users\julie\Documents\TALIA\generateur de cv\talia-app.html'
$dashFile = 'C:\Users\julie\Documents\TALIA\generateur de cv\talia-dashboard-ecole.html'

$enc  = [System.Text.Encoding]::UTF8
$app  = [System.IO.File]::ReadAllText($appFile,  $enc)
$dash = [System.IO.File]::ReadAllText($dashFile, $enc)

# Extract Dashboard JS: from "const state = {" to just before the closing </script>
$stateStart = $dash.IndexOf('const state = {')
$scriptEnd  = $dash.IndexOf('</script>', $stateStart)
$dashJS     = $dash.Substring($stateStart, $scriptEnd - $stateStart).Trim()

Write-Host "Dashboard JS extracted: $($dashJS.Length) chars"

# Fix switchAppView: replace the iframe src assignment line
# Original:  const frame = document.getElementById('generator-frame');
#            if(frame && !frame.src) frame.src = 'talia-cv-v12.html';
# New: call App.navigate('catalog') instead
$oldIframe = "      const frame = document.getElementById('generator-frame');" + [char]10 + "      if(frame && !frame.src) frame.src = 'talia-cv-v12.html';"
$newIframe = "      // Generator embedded directly - no iframe needed" + [char]10 + "      if(typeof App !== 'undefined') App.navigate('catalog');"
if ($dashJS.Contains($oldIframe)) {
    $dashJS = $dashJS.Replace($oldIframe, $newIframe)
    Write-Host "Fixed switchAppView iframe code"
} else {
    Write-Host "WARNING: iframe code not found in dashJS (may already be fixed)"
}

# Add App.init() after Dashboard.loadComments() in the boot code
$loadComment = 'Dashboard.loadComments();'
$withAppInit = 'Dashboard.loadComments();' + [char]10 + '  App.init(); // init CV generator'
if ($dashJS.Contains($loadComment)) {
    $dashJS = $dashJS.Replace($loadComment, $withAppInit)
    Write-Host "Added App.init() to boot"
}

# Find the 2nd INLINE <script> block (not <script src=...)
$pos         = 0
$inlineCount = 0
$targetStart = -1
$targetEnd   = -1

while ($true) {
    $idx = $app.IndexOf('<script', $pos)
    if ($idx -lt 0) { break }

    # Check if this is an inline script (not a CDN src= script)
    $peek = ''
    if ($idx + 20 -lt $app.Length) { $peek = $app.Substring($idx + 7, 5) }
    if ($peek.TrimStart()[0] -ne 's') {   # not 'src='
        $inlineCount++
        Write-Host "Inline script #$inlineCount found at char $idx"
        if ($inlineCount -eq 2) {
            $targetStart = $idx
            $closeLen    = '</script>'.Length
            $targetEnd   = $app.IndexOf('</script>', $idx + 7) + $closeLen
            break
        }
    }
    $pos = $idx + 1
}

if ($targetStart -lt 0) {
    Write-Error 'Could not find second inline script block!'
    exit 1
}
Write-Host "Replacing chars $targetStart to $targetEnd"
Write-Host "That is $(($app.Substring($targetStart, $targetEnd - $targetStart)).Length) chars being replaced"

# Build the new script block
$NL  = [Environment]::NewLine
$newBlock = '<script>' + $NL
$newBlock += '// DASHBOARD STATE + CONTROLLER' + $NL
$newBlock += '// Shared constants (GOOGLE_CLIENT_ID, SUPABASE_URL, etc.) are in the first <script> block above.' + $NL + $NL
$newBlock += $dashJS + $NL
$newBlock += $NL + '</script>'

# Splice into file
$before = $app.Substring(0, $targetStart)
$after  = $app.Substring($targetEnd)
$newApp = $before + $newBlock + $after

[System.IO.File]::WriteAllText($appFile, $newApp, $enc)

$lines = ($newApp -split "`n").Count
Write-Host "Done! Lines: $lines  Chars: $($newApp.Length)"
