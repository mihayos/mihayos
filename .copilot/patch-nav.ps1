$root = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
Get-ChildItem -Path $root -Recurse -Filter *.html | ForEach-Object {
    $path = $_.FullName
    $text = Get-Content -Path $path -Raw
    $new = $text
    $new = $new -replace "<li><a href=\"hotels.html\" data-i18n=\"nav.hotels\">Hotels</a></li>\s*<li><a href=\"contact.html\" data-i18n=\"nav.contact\">Contact</a></li>", "<li><a href='hotels.html' data-i18n='nav.hotels'>Hotels</a></li>\n        <li><a href='blog.html'>Blog</a></li>\n        <li><a href='faq.html'>FAQ</a></li>\n        <li><a href='admin.html'>Admin</a></li>\n        <li><a href='contact.html' data-i18n='nav.contact'>Contact</a></li>"
    $new = $new -replace "<a href=\"hotels.html\" data-i18n=\"nav.hotels\">Hotels</a>\s*<a href=\"contact.html\" data-i18n=\"nav.contact\">Contact</a>", "  <a href='hotels.html' data-i18n='nav.hotels'>Hotels</a>\n  <a href='blog.html'>Blog</a>\n  <a href='faq.html'>FAQ</a>\n  <a href='admin.html'>Admin</a>\n  <a href='contact.html' data-i18n='nav.contact'>Contact</a>"
    $new = $new -replace "<li><a href=\"\.\./hotels.html\" data-i18n=\"nav.hotels\">Hotels</a></li>\s*<li><a href=\"\.\./contact.html\" data-i18n=\"nav.contact\">Contact</a></li>", "<li><a href='../hotels.html' data-i18n='nav.hotels'>Hotels</a></li>\n        <li><a href='../blog.html'>Blog</a></li>\n        <li><a href='../faq.html'>FAQ</a></li>\n        <li><a href='../admin.html'>Admin</a></li>\n        <li><a href='../contact.html' data-i18n='nav.contact'>Contact</a></li>"
    $new = $new -replace "<a href=\"\.\./hotels.html\" data-i18n=\"nav.hotels\">Hotels</a>\s*<a href=\"\.\./contact.html\" data-i18n=\"nav.contact\">Contact</a>", "  <a href='../hotels.html' data-i18n='nav.hotels'>Hotels</a>\n  <a href='../blog.html'>Blog</a>\n  <a href='../faq.html'>FAQ</a>\n  <a href='../admin.html'>Admin</a>\n  <a href='../contact.html' data-i18n='nav.contact'>Contact</a>"
    if ($new -ne $text) {
        Set-Content -Path $path -Value $new
        Write-Host "UPDATED: $path"
    }
}
