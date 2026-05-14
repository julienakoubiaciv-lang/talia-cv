$ErrorActionPreference = 'Stop'
$dash = [System.IO.File]::ReadAllText('C:\Users\julie\Documents\TALIA\generateur de cv\talia-dashboard-ecole.html', [System.Text.Encoding]::UTF8)
$gen  = [System.IO.File]::ReadAllText('C:\Users\julie\Documents\TALIA\generateur de cv\talia-cv-v12.html', [System.Text.Encoding]::UTF8)

Write-Host "Files loaded. dash=$($dash.Length) gen=$($gen.Length)"

# ─── Dashboard CSS
$i1 = $dash.IndexOf('<style>') + 7
$i2 = $dash.IndexOf('</style>')
$dashCSS = $dash.Substring($i1, $i2 - $i1)
Write-Host "dashCSS=$($dashCSS.Length)"

# ─── Generator CSS
$i3 = $gen.IndexOf('<style>') + 7
$i4 = $gen.IndexOf('</style>')
$genCSS = $gen.Substring($i3, $i4 - $i3)
Write-Host "genCSS=$($genCSS.Length)"

# ─── Generator body (between <body> and </body>)
$i5 = $gen.IndexOf('<body>') + 6
$i6 = $gen.LastIndexOf('</body>')
$genBody = $gen.Substring($i5, $i6 - $i5).Trim()
Write-Host "genBody=$($genBody.Length)"

# ─── Dashboard body
$i7 = $dash.IndexOf('<body>') + 6
$i8 = $dash.LastIndexOf('</body>')
$dashBody = $dash.Substring($i7, $i8 - $i7).Trim()
Write-Host "dashBody=$($dashBody.Length)"

# ─── Split dashboard body at known ID-based markers (ASCII-safe)
# NAV: starts at position 0, ends before the iframe/generator view
# We find the old generator view div: <div class="app-view active" id="view-generator"
$genViewStart = $dashBody.IndexOf('id="view-generator"')
# Walk back to find the opening <div
$genDivStart = $dashBody.LastIndexOf('<div', $genViewStart)
Write-Host "genDivStart=$genDivStart"

$navBlock = $dashBody.Substring(0, $genDivStart).Trim()
Write-Host "navBlock=$($navBlock.Length)"

# Find end of the old generator div (the iframe div) - it closes with </div>
# After the iframe line there's </div> then blank line then kanban
$genDivEnd = $dashBody.IndexOf('</div>', $genViewStart) + 6
Write-Host "genDivEnd=$genDivEnd"

# Find kanban-full view start
$kanbanPos = $dashBody.IndexOf('id="view-kanban-full"')
$kanbanDivStart = $dashBody.LastIndexOf('<div', $kanbanPos)
Write-Host "kanbanDivStart=$kanbanDivStart"

# Find planning view start
$planningPos = $dashBody.IndexOf('id="view-planning"')
$planningDivStart = $dashBody.LastIndexOf('<div', $planningPos)
Write-Host "planningDivStart=$planningDivStart"

# Find dashboard view start
$dashViewPos = $dashBody.IndexOf('id="view-dashboard"')
$dashViewDivStart = $dashBody.LastIndexOf('<div', $dashViewPos)
Write-Host "dashViewDivStart=$dashViewDivStart"

# Extract kanban, planning, dashboard view HTML
$kanbanBlock = $dashBody.Substring($kanbanDivStart, $planningDivStart - $kanbanDivStart).Trim()
$planningBlock = $dashBody.Substring($planningDivStart, $dashViewDivStart - $planningDivStart).Trim()
Write-Host "kanbanBlock=$($kanbanBlock.Length) planningBlock=$($planningBlock.Length)"

# Dashboard view HTML: from dashViewDivStart to the <script> tag
$scriptTagPos = $dashBody.IndexOf('<script>')
$dashViewBlock = $dashBody.Substring($dashViewDivStart, $scriptTagPos - $dashViewDivStart).TrimEnd()
Write-Host "dashViewBlock=$($dashViewBlock.Length)"

# Candidate modal: everything after </script>
$endScriptPos = $dashBody.LastIndexOf('</script>') + 9
$candidateModal = $dashBody.Substring($endScriptPos).Trim()
Write-Host "candidateModal=$($candidateModal.Length)"

# ─── Generator script (remove constants block and boot)
$gs1 = $gen.LastIndexOf('<script>') + 8
$gs2 = $gen.LastIndexOf('</script>')
$genScript = $gen.Substring($gs1, $gs2 - $gs1)
Write-Host "genScript=$($genScript.Length)"

# Find where to start keeping: after initSupabase, at the TALIA v9.0 architecture comment
$initFuncPos = $genScript.IndexOf('function initSupabase')
$archTitlePos = $genScript.IndexOf('TALIA v9.0', $initFuncPos)
# Walk back to find the /* opening of that comment
$archCommentPos = $genScript.LastIndexOf('/*', $archTitlePos)
Write-Host "archCommentPos=$archCommentPos"
$genScriptClean = $genScript.Substring($archCommentPos)

# Remove Boot comment and everything after
$bootCommentPos = $genScriptClean.IndexOf('/* Boot */')
Write-Host "bootCommentPos=$bootCommentPos"
$genScriptNoboot = $genScriptClean.Substring(0, $bootCommentPos).TrimEnd()
Write-Host "genScriptNoboot=$($genScriptNoboot.Length)"

# ─── Dashboard script (state + Dashboard object, no constants, no boot)
$ds1 = $dash.IndexOf('<script>') + 8
$ds2 = $dash.LastIndexOf('</script>')
$dashScript = $dash.Substring($ds1, $ds2 - $ds1)
Write-Host "dashScript=$($dashScript.Length)"

$statePos = $dashScript.IndexOf('const state = {')
# Use window.addEventListener('load' as boot marker
$bootPos = $dashScript.IndexOf("window.addEventListener('load'")
Write-Host "statePos=$statePos bootPos=$bootPos"
$dashScriptClean = $dashScript.Substring($statePos, $bootPos - $statePos).TrimEnd()
Write-Host "dashScriptClean=$($dashScriptClean.Length)"

# ─── Fix generator topbar: add inline display:none
$topbarOld = '<div class="topbar">'
$topbarNew = '<div class="topbar" style="display:none !important;">'
$genBodyFixed = $genBody.Replace($topbarOld, $topbarNew)

# ─── Fix switchAppView: remove iframe generator-frame reference
$oldSwitch = "if(view === 'generator'){`n      const frame = document.getElementById('generator-frame');`n      if(frame && !frame.src) frame.src = 'talia-cv-v12.html';`n    }"
$newSwitch = "if(view === 'generator'){`n      // Generator is now inline`n    }"
$dashScriptClean = $dashScriptClean.Replace($oldSwitch, $newSwitch)
# Also try with different line endings
$oldSwitch2 = "if(view === 'generator'){" + [char]10 + "      const frame = document.getElementById('generator-frame');" + [char]10 + "      if(frame && !frame.src) frame.src = 'talia-cv-v12.html';" + [char]10 + "    }"
$newSwitch2 = "if(view === 'generator'){" + [char]10 + "      // Generator is now inline" + [char]10 + "    }"
$dashScriptClean = $dashScriptClean.Replace($oldSwitch2, $newSwitch2)

Write-Host "Building output..."

# ─── Shared config block
$sharedConfig = @'
// ════════════════════════════════════════
//  CONFIG - a remplir avant deploiement
// ════════════════════════════════════════
const GOOGLE_CLIENT_ID = '';
const DRIVE_FOLDER_ID  = '';
const SHEETS_ID        = '';
const MONDAY_TOKEN     = '';
const MONDAY_BOARD_ID  = '';
const ANTHROPIC_KEY    = '';

// SUPABASE
const SUPABASE_URL = 'https://dankawtulegneeggmarg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_d3_Kw4jvLuLErfEsRVBaRw_Eq8ACWv_';
let supabase = null;
let sb = null;
function initSupabase(){
  if(SUPABASE_URL && SUPABASE_KEY && window.supabase){
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    sb = supabase;
    console.log('Supabase connecte');
    return true;
  }
  return false;
}
'@

# ─── Boot block
$bootBlock = @'

// BOOT
document.addEventListener('DOMContentLoaded', async () => {
  Dashboard.switchAppView('dashboard');
  Dashboard.loadComments();
  const hasSupa = initSupabase();
  if(hasSupa){
    await Dashboard.loadFromSupabase();
    Dashboard.subscribeRealtime();
  }
  if(GOOGLE_CLIENT_ID && typeof gapi !== 'undefined'){
    Dashboard.initGapi();
  } else if(!GOOGLE_CLIENT_ID){
    Dashboard.renderDemo();
    const btnLogin = document.getElementById('btn-login');
    if(btnLogin) btnLogin.textContent = 'Mode demo';
    const btnScore = document.getElementById('btn-score-all');
    if(btnScore) btnScore.disabled = !ANTHROPIC_KEY;
  }
  App.init();
  document.querySelectorAll('.modal-overlay').forEach(function(m){
    m.addEventListener('click', function(e){ if(e.target === m) m.classList.remove('on'); });
  });
  setInterval(function(){
    var ws = document.getElementById('workspace');
    if(ws && ws.classList.contains('on')) App.updateSaveStatus();
  }, 10000);
});
'@

# ─── Head HTML
$headHTML = @'
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="theme-color" content="#0033a0"/>
<title>Talia — Dashboard &amp; Generateur CV</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://apis.google.com/js/api.js" async defer></script>
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css"/>
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<style>
'@

$nl = [System.Environment]::NewLine

# ─── Assemble
$parts = [System.Collections.Generic.List[string]]::new()
$parts.Add($headHTML)
$parts.Add($dashCSS)
$parts.Add($nl + $nl + '/* ═══════════════════════════════════════════' + $nl)
$parts.Add('   GENERATEUR CV — STYLES INTEGRES' + $nl)
$parts.Add('   La topbar generateur est masquee car remplacee' + $nl)
$parts.Add('   par la app-nav du dashboard.' + $nl)
$parts.Add('══════════════════════════════════════════════ */' + $nl)
$parts.Add('#view-generator .topbar { display: none !important; }' + $nl)
$parts.Add($genCSS)
$parts.Add($nl + '</style>' + $nl + '</head>' + $nl + '<body>' + $nl + $nl)
$parts.Add($navBlock)
$parts.Add($nl + $nl + '<!-- VUE GENERATEUR CV (inline) -->' + $nl)
$parts.Add('<div class="app-view" id="view-generator" style="display:none;">' + $nl)
$parts.Add($genBodyFixed)
$parts.Add($nl + '</div>' + $nl + $nl)
$parts.Add($kanbanBlock)
$parts.Add($nl + $nl)
$parts.Add($planningBlock)
$parts.Add($nl + $nl)
$parts.Add($dashViewBlock)
$parts.Add($nl + $nl + '<script>' + $nl)
$parts.Add($sharedConfig)
$parts.Add($nl)
$parts.Add($genScriptNoboot)
$parts.Add($nl + $nl + '// DASHBOARD STATE + CONTROLLER' + $nl)
$parts.Add($dashScriptClean)
$parts.Add($bootBlock)
$parts.Add($nl + '</script>' + $nl + $nl)
$parts.Add($candidateModal)
$parts.Add($nl + $nl + '</body>' + $nl + '</html>')

$output = [string]::Concat($parts)
Write-Host "Total output length: $($output.Length)"

[System.IO.File]::WriteAllText('C:\Users\julie\Documents\TALIA\generateur de cv\talia-app.html', $output, [System.Text.Encoding]::UTF8)
$fi = Get-Item 'C:\Users\julie\Documents\TALIA\generateur de cv\talia-app.html'
Write-Host "File written: $($fi.Length) bytes"
$lines = ($output -split "`n").Count
Write-Host "Lines: $lines"
