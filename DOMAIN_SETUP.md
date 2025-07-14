# Domain Setup Instructions

## 🌐 Custom Domain Configuration Added

Your winery website is now configured to use the custom domain: **valleyoakwinery.chrisubick.io**

## 📋 Deployment Steps

### 1. First-Time Infrastructure Setup

```bash
# Make sure terraform.tfvars exists with your domain
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars if needed

# Deploy infrastructure
npm run tf:init
npm run tf:plan
npm run tf:apply
```

### 2. Configure DNS with Domain Registrar

After `terraform apply` completes, you'll get Route 53 name servers in the output:

```bash
route53_name_servers = [
  "ns-1234.awsdns-12.com",
  "ns-5678.awsdns-34.net", 
  "ns-9012.awsdns-56.org",
  "ns-3456.awsdns-78.co.uk"
]
```

**Go to your domain registrar** (where you manage `chrisubick.io`) and:

- Create a subdomain `valleyoakwinery.chrisubick.io`
- Set the name servers to the ones from the Terraform output

### 3. Deploy Website

```bash
# Deploy static website to S3 + CloudFront
npm run website:deploy
```

### 4. One-Command Deployment (Future Updates)

```bash
# Deploy both Lambda APIs and website in one command
npm run deploy:all
```

## 🏗️ Infrastructure Created

- **Route 53 Hosted Zone** - DNS management for valleyoakwinery.chrisubick.io
- **ACM Certificate** - Free SSL/TLS certificate for HTTPS
- **CloudFront Distribution** - Global CDN with custom domain
- **S3 Website Bucket** - Static website hosting
- **API Integration** - Routes `/api/*` to Lambda functions

## 🌍 Final URLs

- **Website**: <https://valleyoakwinery.chrisubick.io>
- **API**: <https://valleyoakwinery.chrisubick.io/api/>

## ⚠️ Important Notes

1. **DNS Propagation**: After configuring your domain registrar, DNS changes can take up to 24-48 hours to propagate globally.

2. **SSL Certificate**: The ACM certificate will be automatically validated via DNS once the domain is properly configured.

3. **Static Export**: The website is configured for static export, which means:
   - No server-side rendering at runtime
   - All API calls go to Lambda functions via CloudFront
   - Faster loading and better caching

4. **CloudFront Caching**:
   - Static content is cached for better performance
   - API calls bypass cache for dynamic content
   - Use `npm run website:deploy` to invalidate cache after updates

## 🔧 Development vs Production

- **Development**: `npm run dev` (local server with API mocking)
- **Production**: Static files served from CloudFront + Lambda APIs

Your winery website will be accessible at the custom domain with enterprise-grade performance and security! 🍷
