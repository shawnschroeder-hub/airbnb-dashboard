# Makes ACTUALS copies of the three Deal Analyzer workbooks (originals untouched) via Excel COM.
$dir = "C:\Users\shawn\Desktop\Agent OS\01 Projects\Airbnb Acquisitions\Analyzers"
$jobs = @(
  @{ src = "63 - *"; dst = "186 - 423 S Rivard St (ACTUALS Oct25-Oct26, bank loan), Bourbonnais.xlsx"; price = 200000; tax = 3170; payout = 41530.49; nights = 263; stays = 84; clean = 100;
     note = "Airbnb 'Revard' paid out 28,064.71 (178 nights, avg stay 3.1 = 57 stays) + Vrbo paid out 13,465.78 (85 nights, 27 bookings)." },
  @{ src = "62 - *"; dst = "187 - 239 W Country Ct (ACTUALS Oct25-Oct26, bank loan), Bourbonnais.xlsx"; price = 225000; tax = 4800; payout = 45786.84; nights = 264; stays = 92; clean = 125;
     note = "Airbnb 'Arnie's place' (matched to Country Ct - confirm with Ami) paid out 35,553.20 (211 nights, avg stay 3.2 = 66 stays) + Vrbo paid out 10,233.64 (53 nights, 26 bookings). Taxes 4,800 still an estimate." },
  @{ src = "65 - *"; dst = "188 - 287 E Munroe St (ACTUALS Oct25-Oct26, bank loan), Bourbonnais.xlsx"; price = 210000; tax = 4670; payout = 13719.46; nights = 74; stays = 23; clean = 150;
     note = "Vrbo only ('272 E Munroe Ave' on Vrbo) paid out 13,719.46 (74 nights, 23 bookings); not in the Airbnb report. Any long-term rent from part of the year is NOT included. Furnishing/repairs set to 0 because it is already operating on Vrbo." }
)
$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false; $xl.DisplayAlerts = $false
$out = @()
foreach ($j in $jobs) {
  $src = (Get-ChildItem -Path $dir -Filter $j.src | Select-Object -First 1).FullName
  $dst = Join-Path $dir $j.dst
  Copy-Item $src $dst -Force
  $wb = $xl.Workbooks.Open($dst)
  $pd = $wb.Worksheets.Item("Property Details")
  $ie = $wb.Worksheets.Item("Income and Expenses")
  $dn = $wb.Worksheets.Item("Directions and Notes")
  $pd.Range("B6").Value2 = [double]$j.price
  $pd.Range("B7").Value2 = [double]0
  $pd.Range("B8").Value2 = [double]$j.price
  $pd.Range("B9").Value2 = [double]$j.tax
  $pd.Range("B10").Value2 = [double]1800
  $pd.Range("B11").Value2 = [double]0
  $pd.Range("B12").Value2 = [double]0
  $pd.Range("B15").Value2 = [double]0.8
  $pd.Range("B20").Value2 = [double]30
  $pd.Range("B21").Value2 = [double]0.08
  $occ = [double]($j.nights / 365)
  $adr = [double](($j.payout - $j.stays * $j.clean) / $j.nights)
  foreach ($c in "B8","C8") { $ie.Range($c).Value2 = $adr }
  foreach ($c in "B13","C13") { $ie.Range($c).Value2 = $occ }
  $perMonth = [double]($j.stays / 12.1666666666667)
  $ie.Range("B19").Value2 = [double]$j.clean
  $ie.Range("B20").Value2 = [double]$j.clean
  $ie.Range("B21").Value2 = $perMonth
  $ie.Range("B22").Value2 = $perMonth
  $dn.Range("A30").Value2 = "UPDATED 2026-10-18 FROM THE SELLERS' ACTUAL EARNINGS (Airbnb earnings report + Vrbo payout summary, Oct 6 2025 - Oct 6 2026). " + $j.note
  $dn.Range("A31").Value2 = "FINANCING: bank loan, 20% down, 8.0%, 30 years (Loan Options Board realistic DSCR band is 7.5-8.5%). Closing costs not included."
  $dn.Range("A32").Value2 = ("INCOME: nightly rate = (actual payout - cleaning fees) / booked nights = {0:N2}; occupancy = booked nights / 365 = {1:P1}; cleanings = {2} actual stays. Payouts are after Airbnb/Vrbo fees, so the totals here equal what was actually paid out." -f $adr, $occ, $j.stays)
  $dn.Range("A33").Value2 = "CLEANING IT YOURSELF: set 'Income and Expenses' B20 (Amount Paid to Cleaner) to 0 - the guests' cleaning fee stays with you."
  $xl.CalculateFull()
  $out += [pscustomobject]@{ file = $j.dst; adr = [math]::Round($adr,2); occ = [math]::Round($occ,4); gross = [math]::Round($ie.Range("B25").Value2,2); expMo = [math]::Round($ie.Range("B39").Value2,2); cfMo = [math]::Round(($ie.Range("B25").Value2/12) + $ie.Range("B39").Value2,2) }
  $wb.Save(); $wb.Close($false)
}
$xl.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
$out | Format-Table -AutoSize | Out-String -Width 200
