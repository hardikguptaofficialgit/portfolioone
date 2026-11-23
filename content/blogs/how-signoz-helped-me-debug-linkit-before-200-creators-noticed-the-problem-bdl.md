---
id: how-signoz-helped-me-debug-linkit-before-200-creators-noticed-the-problem-bdl
slug: how-signoz-helped-me-debug-linkit-before-200-creators-noticed-the-problem-bdl
tags:
  - debugging
  - monitoring
  - startup
  - webdev
title: How SigNoz Helped Me Debug Linkit Before 200+ Creators Noticed the Problem
excerpt: When you're building a product that's actually being used, debugging
  changes completely.  Console...
archived: false
featured: true
sortOrder: 999
coverImage: /images/blogs/78e9d60500.webp
readingTimeMinutes: 4
---

When you're building a product that's actually being used, debugging changes completely.

Console logs work when you're the only user.

They don't work when hundreds of people are creating pages, scanning QR codes, uploading products, and opening links from different devices at the same time.

I ran into exactly that while building **Linkit**, a creator platform that lets creators, caf?s, and businesses build customizable link-in-bio pages with product catalogs, digital menus, forms, and AI-powered tools.
As usage grew, I started noticing an annoying issue.

Some users said their pages opened instantly.

Others reported that the exact same page sometimes took 4â€“5 seconds to load.

The worst part?

I couldn't reproduce it consistently.

Everything looked normal on my machine.

This is where I stopped relying on logs and started using **OpenTelemetry** with **SigNoz**.

---

# Architecture

Linkit isn't just a React frontend.

Every request goes through multiple services before the final page is rendered.

Current stack:

- React + Vite
- Node.js + Express
- PostgreSQL
- Redis
- Cloudinary
- OpenTelemetry
- SigNoz

A single request for a public profile may involve:

1. Authentication
2. Fetching profile data
3. Loading products
4. Fetching analytics
5. Loading custom theme
6. Resolving images
7. Returning the final response

Without distributed tracing, figuring out which step is slow is mostly guessing.

---

# Adding OpenTelemetry

Getting started was surprisingly simple.

Install the packages:

```bash
npm install @opentelemetry/sdk-node \
@opentelemetry/auto-instrumentations-node \
@opentelemetry/exporter-trace-otlp-http
```

Create an instrumentation file:

```javascript
const { NodeSDK } = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4318/v1/traces",
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

Run the server:

```bash
node --require ./instrumentation.js server.js
```

Within minutes, traces started appearing inside SigNoz.

---

# The First Discovery

Initially, I assumed PostgreSQL was causing the slowdown.

The traces immediately proved me wrong.

Typical request:

```plaintext
Incoming Request
        â”‚
        â–¼
Authentication (12 ms)
        â”‚
        â–¼
Database Query (24 ms)
        â”‚
        â–¼
Generate Components (430 ms)
        â”‚
        â–¼
Cloudinary Lookup (280 ms)
        â”‚
        â–¼
Response
```

The database wasn't the problem.

It only accounted for around **24 milliseconds**.

Most of the request time was being spent generating page components and fetching media.

Without tracing, I would've spent hours optimizing SQL queries that were already fast.

---

# Finding Duplicate Work

Every Linkit page can contain:

- Social links
- Products
- Forms
- Digital menus
- Embedded videos
- Analytics widgets
- AI-generated sections

SigNoz traces showed that some profile layouts were requesting identical resources multiple times.

For one page, the same API endpoint was called **four times** during a single request.

That wasn't obvious from logs.

Adding a small Redis cache reduced page generation time from:

**920 ms ? 310 ms**

No frontend changes.

No database optimization.

Just removing unnecessary work.

---

# Monitoring Traffic

As Linkit grew, I stopped opening terminal logs altogether.

Instead, I kept a SigNoz dashboard open.

It answered questions instantly:

- Which endpoint is slow today?
- Are uploads failing?
- How many requests are arriving every minute?
- Is Redis healthy?
- Did the latest deployment increase latency?
- Is memory usage stable?

Having all of that in one place made debugging dramatically faster.

---

# One Bug That Would've Taken Hours

A creator reported that image uploads occasionally failed.

The frontend simply displayed:

```plaintext
Upload Failed
```

Not exactly useful.

The trace showed something completely different.

```plaintext
Frontend

â†“

Authentication

â†“

Generate Upload Signature

â†“

Cloudinary API

â†“

Timeout

â†“

Retry

â†“

Success
```

The backend wasn't failing.

Cloudinary occasionally timed out, triggering the retry mechanism.

Instead of rewriting upload code, I adjusted timeout settings and improved retry logic.

Problem solved.

---

# Error Monitoring

One endpoint consistently had a higher failure rate.

```http
POST /api/forms/submit
```

Opening the traces revealed the issue immediately.

Some users were uploading files larger than the backend allowed.

Instead of returning generic 500 errors, I added proper validation and descriptive error messages.

Support requests dropped almost immediately.

---

# Business Metrics Matter Too

Technical metrics are useful.

Business metrics are even better.

Besides the default dashboards, I created custom metrics for Linkit.

These included:

- New creator registrations
- Published pages
- QR scans
- Link clicks
- Product purchases
- Form submissions
- AI content generations
- Payment events

Being able to correlate product activity with infrastructure metrics helped answer questions like:

- Did increased traffic actually slow the application?
- Did yesterday's deployment reduce conversion?
- Which features receive the most usage?

Instead of only monitoring servers, I was monitoring the product itself.

---

# Deployments Became Less Stressful

Before using SigNoz, deploying meant:

1. Push code.
2. Refresh the app.
3. Hope everything works.

Now every deployment is followed by watching:

- Error rate
- Request latency
- Memory usage
- CPU utilization
- Slow traces
- Database performance

If anything spikes, it's visible within minutes.

That confidence alone makes observability worth adding.

---

# Lessons Learned

The biggest lesson wasn't finding bugs.

It was learning where the bugs **weren't**.

Several times I blamed PostgreSQL.

The traces showed perfectly healthy queries.

Other times I suspected Redis.

The real issue was duplicate API requests.

Without observability, I would've optimized the wrong parts of the application.

With traces and metrics, every optimization was backed by evidence instead of assumptions.

---

# Conclusion

Adding OpenTelemetry and SigNoz changed how I debug Linkit.

Instead of relying on console logs and intuition, I now have visibility into every request, every database query, every external API call, and every performance bottleneck.

As Linkit continues to grow, observability has become just as important as testing.

Building features gets users.

Keeping those features fast, reliable, and measurable keeps them coming back.
