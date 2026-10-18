$dir = "C:\Users\shawn\Desktop\Agent OS\01 Projects\Airbnb Acquisitions\Analyzers"
$notes = @{
 "186" = "Airbnb 'Revard' paid out 28,064.71 (178 nights, avg stay 3.1 = 57 stays) + Vrbo paid out 13,465.78 (85 nights, 27 bookings).";
 "187" = "Airbnb 'Arnie's place' (matched to Country Ct - confirm with Ami) paid out 35,553.20 (211 nights, avg stay 3.2 = 66 stays) + Vrbo paid out 10,233.64 (53 nights, 26 bookings). Taxes 4,800 still an estimate.";
 "188" = "Vrbo only ('272 E Munroe Ave' on Vrbo) paid out 13,719.46 (74 nights, 23 bookings); not in the Airbnb report. Any long-term rent from part of the year is NOT included. Furnishing/repairs set to 0 because it is already operating on Vrbo."
}
$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false; $xl.DisplayAlerts = $false
foreach ($k in $notes.Keys) {
  $f = (Get-ChildItem -Path $dir -Filter "$k - *").FullName
  $wb = $xl.Workbooks.Open($f)
  $dn = $wb.Worksheets.Item("Directions and Notes")
  $lines = @(
    [string]("UPDATED 2026-10-18 FROM THE SELLERS' ACTUAL EARNINGS (Airbnb earnings report + Vrbo payout summary, Oct 6 2025 - Oct 6 2026). " + $notes[$k]),
    [string]"FINANCING: bank loan, 20% down, 8.0%, 30 years (Loan Options Board realistic band 7.5-8.5%). Closing costs not included.",
    [string]"INCOME: nightly rate = (actual payout - cleaning fees) / booked nights; occupancy = booked nights / 365; cleanings = actual stays. Payouts are after Airbnb/Vrbo fees, so the income total equals what was actually paid out.",
    [string]"CLEANING IT YOURSELF: set 'Income and Expenses' B20 (Amount Paid to Cleaner) to 0 - the guests' cleaning fee then stays with you."
  )
  for ($i = 0; $i -lt 4; $i++) { $dn.Cells.Item(30 + $i, 1).Formula = $lines[$i] }
  $wb.Save()
  "{0}: A30 = {1}" -f $k, ($dn.Cells.Item(30,1).Text).Substring(0,60)
  $wb.Close($false)
}
$xl.Quit()
