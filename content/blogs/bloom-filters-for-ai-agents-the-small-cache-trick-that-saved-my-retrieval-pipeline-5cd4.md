---
id: bloom-filters-for-ai-agents-the-small-cache-trick-that-saved-my-retrieval-pipeline-5cd4
slug: bloom-filters-for-ai-agents-the-small-cache-trick-that-saved-my-retrieval-pipeline-5cd4
tags:
  - bloomfilter
  - agents
  - typescript
  - performance
title: "Bloom Filters for AI Agents: The Small Cache Trick That Saved My Retrieval Pipeline"
excerpt: Bloom filters felt like a purely academic data structure - until an agent pipeline started repeating...
archived: false
featured: false
coverImage: /images/blogs/77f80620ab.webp
readingTimeMinutes: 2
---

Bloom filters felt like a purely academic data structure - until an agent pipeline started repeating work. At that point, they became immediately practical.

---

## Problem


The system needed a fast, low-cost way to check whether something had *probably* been seen before.

Not certainty. A strong enough signal to avoid redundant work.

---

## Failure Mode

The agent repeatedly:

- revisited identical document IDs  
- re-triggered the same tool calls  
- reprocessed items already handled minutes earlier  

This created:

- unnecessary latency  
- increased compute cost  
- degraded pipeline efficiency  

A lightweight pre-check layer was required.

---

## Approach

Introduce a Bloom filter as a front-line gate:

- If **definitely new** ? process  
- If **possibly seen** ? verify via authoritative store  

Properties leveraged:

- No false negatives  
- Acceptable false positives  

---

## Mental Model


![Image description](/images/blogs/19de713036.png)

A Bloom filter consists of:

- a fixed-size bit array  
- multiple hash functions  
- a probabilistic membership check  

**Insert**
- hash value multiple times  
- set corresponding bits to `1`  

**Query**
- if any bit is `0` ? **definitely not present**  
- if all bits are `1` ? **possibly present**  

---

## Implementation

```ts
class BloomFilter {
  private bits = new Uint8Array(2048);
  private readonly seeds = [17, 31, 53, 73];

  private hash(value: string, seed: number) {
    let hash = seed;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 33 + value.charCodeAt(i)) % this.bits.length;
    }
    return hash;
  }

  add(value: string) {
    for (const seed of this.seeds) {
      this.bits[this.hash(value, seed)] = 1;
    }
  }

  has(value: string) {
    return this.seeds.every(
      (seed) => this.bits[this.hash(value, seed)] === 1
    );
  }
}
```

## Where It Fit in My Agent Stack


![Image description](/images/blogs/ec9db65b8c.png)

I ended up using Bloom filters in three key places:

### 1. Event Deduplication

Before the agent processes anything, I filter out repeated inputs. This alone removed a lot of noise.

### 2. Retrieval Optimization

While scanning candidate documents, I skip anything that has likely been seen before. This reduced unnecessary lookups.

### 3. Tool Call Short-Circuiting

This was the biggest win.

Agents tend to repeat tool calls when context becomes messy. A Bloom filter doesn?t fix reasoning, but it stops the system from wasting cycles on the same targets again and again.

---

## The Tradeoff I Respect

![Image description](/images/blogs/c78d90488e.png)



I don?t use Bloom filters when I need certainty.

I use them when I need:

- speed  
- low memory usage  
- a fast first-pass filter  

They are not a source of truth.

They are a guardrail.

---

## Final Take

Bloom filters work best as a front-line defense against wasted effort.

They don?t fix reasoning.  
They don?t improve intelligence.  

What they do is enforce discipline in the system - quietly, efficiently, and at scale.

In agent pipelines, that?s often exactly what is missing.

---

## Discussion

How do you handle deduplication in your AI workflows?

- Redis / Postgres with exact checks?  
- Probabilistic structures like Bloom or Cuckoo filters?  
- Something hybrid?

