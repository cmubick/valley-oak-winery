# terraform/valleyoakwinery-com.tf
#
# Moving valleyoakwinery.com from iPage / Network Solutions to this AWS account, without
# taking the old site or the winery's email down along the way.
#
# Stage 1 (this file today): a Route 53 copy of the domain's current iPage DNS, plus the
#   HTTPS certificate for the new site. Nothing changes for visitors: the copied records
#   still point the website and email at iPage.
# Stage 2 (Network Solutions, by hand): switch the domain's nameservers to the four
#   `prod_nameservers` output below. Still no visible change; the certificate validates.
# Stage 3 (cutover, Nov 4, 2026): valleyoakwinery.com and www point at the Amplify app;
#   valleyoakwinery.com redirects to www (next.config.ts).
#
# Email (info@valleyoakwinery.com) stays on iPage's mail servers throughout. Don't cancel
# the iPage / Network Solutions hosting plan until email has been moved somewhere else.

locals {
  prod_domain = "valleyoakwinery.com"
  ipage_web   = "66.96.147.105" # old site, and iPage's catch-all for every other name
  dns_ttl     = 300             # short, so any change (or rollback) takes effect within minutes
}

resource "aws_route53_zone" "prod" {
  name    = local.prod_domain
  comment = "Valley Oak Winery (moved from iPage)"
}

# ---------------------------------------------------------------------------
# Copies of the iPage records, as served by ns1.ipage.com on Nov 4, 2026

# The old site's record for valleyoakwinery.com. At cutover Amplify replaced it with a record
# pointing at the new site, so Terraform stops managing it (without deleting it).
removed {
  from = aws_route53_record.ipage_site
  lifecycle {
    destroy = false
  }
}

# iPage answers every other name (mail., smtp., imap., ftp., cpanel., …) with the web host.
resource "aws_route53_record" "ipage_wildcard" {
  zone_id = aws_route53_zone.prod.zone_id
  name    = "*.${local.prod_domain}"
  type    = "A"
  ttl     = local.dns_ttl
  records = [local.ipage_web]
}

# iPage webmail
resource "aws_route53_record" "ipage_webmail" {
  for_each = toset(["webmail", "email"])
  zone_id  = aws_route53_zone.prod.zone_id
  name     = "${each.key}.${local.prod_domain}"
  type     = "A"
  ttl      = local.dns_ttl
  records  = ["66.96.147.20"]
}

# Incoming email
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.prod.zone_id
  name    = local.prod_domain
  type    = "MX"
  ttl     = local.dns_ttl
  records = ["30 mx.${local.prod_domain}"]
}

resource "aws_route53_record" "mx_host" {
  zone_id = aws_route53_zone.prod.zone_id
  name    = "mx.${local.prod_domain}"
  type    = "A"
  ttl     = local.dns_ttl
  records = ["66.96.140.142", "66.96.140.143"]
}

# Which servers may send email as @valleyoakwinery.com
resource "aws_route53_record" "spf" {
  zone_id = aws_route53_zone.prod.zone_id
  name    = local.prod_domain
  type    = "TXT"
  ttl     = local.dns_ttl
  records = ["v=spf1 ip4:66.96.128.0/18 include:websitewelcome.com ?all"]
}

# Email signing (DKIM): iPage's mail servers, and Mailchimp for the mailing list
resource "aws_route53_record" "dkim" {
  for_each = {
    "dkim._domainkey" = "cur.dkim.v.eigmail.net"
    "k2._domainkey"   = "dkim2.mcsv.net"
    "k3._domainkey"   = "dkim3.mcsv.net"
  }
  zone_id = aws_route53_zone.prod.zone_id
  name    = "${each.key}.${local.prod_domain}"
  type    = "CNAME"
  ttl     = local.dns_ttl
  records = [each.value]
}

resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.prod.zone_id
  name    = "_dmarc.${local.prod_domain}"
  type    = "TXT"
  ttl     = local.dns_ttl
  records = ["v=DMARC1; p=none;"]
}

# Lets iPage keep renewing the old site's Let's Encrypt certificate until cutover.
resource "aws_route53_record" "ipage_acme" {
  zone_id = aws_route53_zone.prod.zone_id
  name    = "_acme-challenge.${local.prod_domain}"
  type    = "CNAME"
  ttl     = local.dns_ttl
  records = ["valleyoakwinery.com.letsencrypt.vdeck.eigdyn.com"]
}

# ---------------------------------------------------------------------------
# HTTPS certificate for the new site (Amplify needs it in us-east-1). Requested now so it is
# already issued at cutover; it validates by itself once the nameservers point at Route 53.

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_acm_certificate" "prod" {
  provider                  = aws.us_east_1
  domain_name               = local.prod_domain
  subject_alternative_names = ["www.${local.prod_domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "prod_cert_validation" {
  for_each = {
    for o in aws_acm_certificate.prod.domain_validation_options : o.domain_name => o
  }
  zone_id         = aws_route53_zone.prod.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  ttl             = 300
  records         = [each.value.resource_record_value]
  allow_overwrite = true
}

# ---------------------------------------------------------------------------
# The new site (stage 3). Because the zone is in this account, Amplify writes the
# valleyoakwinery.com and www records itself, pointing them at the app.

resource "aws_amplify_domain_association" "prod" {
  app_id                = aws_amplify_app.winery.id
  domain_name           = local.prod_domain
  wait_for_verification = false

  certificate_settings {
    type                   = "CUSTOM"
    custom_certificate_arn = aws_acm_certificate.prod.arn
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }
}

# ---------------------------------------------------------------------------

output "prod_nameservers" {
  description = "Enter these at Network Solutions (stage 2)"
  value       = aws_route53_zone.prod.name_servers
}

output "prod_certificate_arn" {
  value = aws_acm_certificate.prod.arn
}
