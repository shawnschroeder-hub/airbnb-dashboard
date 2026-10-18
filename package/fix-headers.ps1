$dir = "C:\Users\shawn\Desktop\Agent OS\01 Projects\Airbnb Acquisitions\Analyzers"
$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false; $xl.DisplayAlerts = $false
foreach ($k in "186","187","188") {
  $f = (Get-ChildItem -Path $dir -Filter "$k - *").FullName
  $wb = $xl.Workbooks.Open($f)
  foreach ($pair in @(@("Property Details","A2"), @("Income and Expenses","A4"))) {
    $c = $wb.Worksheets.Item($pair[0]).Range($pair[1])
    $t = [string]$c.Text
    $t = $t -replace 'OWNER-FIN PKG #\d+( — LTR-TO-STR CONVERSION)?', 'ACTUALS Oct 2025-Oct 2026, bank loan 8%'
    $t = $t -replace 'currently a long-term rental; ', 'operating on Vrbo; '
    $c.Formula = [string]$t
  }
  $wb.Save()
  "{0}: {1}" -f $k, $wb.Worksheets.Item("Property Details").Range("A2").Text
  $wb.Close($false)
}
$xl.Quit()
