---
id: system-design-simply-tp1
slug: system-design-simply-tp1
title: Edge Caching & CDN ( Netflix )
excerpt: SSD tp1
tags:
featured: false
archived: false
coverImage:
---
CDN (Content Delivery Network)

Our first question is: What does it do?

If we take Netflix as an example, a CDN makes websites and videos load faster by storing copies of content on servers located closer to users.

It is a group of servers distributed across different cities and countries. Their job is to deliver content (images, CSS, JS, videos) to users quickly.

Suppose Netflix's main origin server is in the USA, but its users are in India, Japan, etc.

**Without a CDN:** You have to get the content from the origin server, which is in the USA.

**With a CDN:** You can get the content from the nearest Netflix server.

**Example:**

Let's take a popular movie like _The Dark Knight_.

Without a CDN, a user in India has to request the movie from the main server in the USA. The data has to travel a long distance, so the video takes longer to load. If millions or billions of users request it, it can take a lot of time.

With a CDN, Netflix keeps copies of popular content in different locations. Popular content is stored closer to users because many people request it. Unpopular content usually comes from the main server or another upstream cache.

**What happens?**

- Netflix keeps a copy of the movie on an edge server near India.
    
- You open Netflix in India.
    
- Netflix directs your request to a nearby edge server.
    
- The edge server delivers the movie to you.
    
- The movie loads faster because the data travels a shorter distance.
    

This is the basic working of a CDN.

## Four Important Terms

1. **Origin Server:** The main storage location that holds the original content.
    
2. **Edge Server:** A nearby delivery location that stores copies of popular content closer to users.
    
3. **PoP (Point of Presence):** A physical location where CDN infrastructure is deployed. For example, a CDN might have PoPs in Mumbai, Delhi, etc. One PoP can contain many servers.
    
4. **Edge Caching:** Keeping a copy of frequently requested content so it can be reused. Instead of fetching the same movie every time, the CDN can reuse its stored copy.
    

## How Does a CDN Work?

**CDN Request Flow**

You are in Rajasthan, India, and you request a movie. Netflix directs your request to a nearby CDN server. The server then checks whether the movie is already stored there.

There are two possibilities:

- **Cache Hit:** The movie is available on the edge server, so it is sent directly to you.
    
- **Cache Miss:** The movie is unavailable, so it is fetched from the origin server or another upstream cache, stored, and then delivered to you.

We found out about the two terms: cache hit and cache miss.

- Cache hit: the requested content is already available on the server.
- Cache miss: the requested content is not available, so the server needs to fetch it from origin.
  
Why do we need CDN? The four major reasons, like the problem:

- High latency: serves content from nearby servers.
- Heavy traffic: means distribute requests across many edge servers.
- Origin overload: matlab reduces repeated requests to the origin.
- Bandwidth cost: reduces repeated long-distance data transfer.

But one thing: CDN does not automatically eliminate a single point of failure. It improves availability through distributed infrastructure, but the thing is, origin failures, CDN failures, and cache misses can still cause problems. 

One of the most excited parts I like is that Netflix has its own content delivery system actually called Open Connect. See, Netflix is a big company. It has a lot of content to deliver to its users. It's not applicable for every small company to build their own infra, CDN infra, to deliver their content, so they use services like Cloudflare, Akamai, etc. 

There's a simplified process. Netflix prepares the video files in different quality levels, like 1080p, 1440p, 720, and 360p. That video content is then distributed to Open Connect appliances, called OCA, which are specialized caching servers deployed close to viewers, often within internet service provider networks. When you press play, the Netflix system helps direct your playback to an appropriate nearby server. The server delivers video data to your device. 

What we learn about CDN is basically a geographically distributed network of edge servers that cache content close to users, reduce latency, distribute traffic, lower the origin server load, and improve the content delivery speed. 


![[Pasted image 20261124145915.png]]

BTS: when you press play on Netflix, the four important steps. What does it do?

1. It finds the nearest server DNS.
2. Checks whether content exists. If it exists, cache hit. If it's not, miss.
3. Managing old and new content: TTL and eviction (time to live).
4. Filling servers with content: pull versus pull cdn .
 See, the first one: if I talk about DNS, it's basically the domain name. Netflix.com needs an IP address, or the numerical address of a server, to connect. 
 
 DNS translates that domain name, Netflix.com, into an IP address. 
 When you request the content, the CDN DNS-based routing system can direct you towards a suitable nearby edge server. 
 ![[Pasted image 20261124152743.png]]

In simple language, it is like you request the Netflix content. Netflix's DNS helps resolve the content delivery hostname. The CDN uses that information, such as the network location and the server availability. It returns an appropriate edge server address, and your device connects to that edge server. 


Suppose Mumbai, Delhi, and Singapore all advertise the same IP address. There's another way to route the users. There is a term called **AnyCast**. Basically, your network routes the request towards the nearest available network destination using the routing protocols. 

What is Anycast? In simple terms, it is basically when multiple locations advertise the same IP address, and the network routing directs traffic towards one of them.
![[Pasted image 20261124153029.png]]


See, the next thing is very good about what is good about cache hit and cache miss:

- Cache hit: faster response, less work for the origin server, less serialized data transfer from the origin.
- Cache miss: content doesn't exist, so it fetches from the upstream, and usually a slower origin may be contacted.


See also, there is one thing: imagine the ad server stores a copy of a website image, and the original image gets updated. What happens to the old copy? There should be a mechanism to manage the freshness of that particular image, right?

The first thing is TTL (time to live). TTL means how long cached content can be considered fresh. Think of it as an expiry date on a food packet, right? 

For example, Netflix has a piece of content on a server with a TTL of 60 seconds. From 0 to 60 seconds, the content will be cached, but after that, it will expire, so the CDN may need to revalidate or fetch a fresh copy. Here, revalidate means:
If the fresh copy is the same as the old copy, it means nothing new has been done, so we can just validate it.

See:

- TTL expiry doesn't necessarily mean that the cache file is immediately deleted. It means the file is no longer considered to be fresh to show to the users.

 Eviction: removing old content. Imagine your edge server has storage for only 100 movies. Now users start requesting 101 different movies. Where will the new movie go? The server needs to remove something to make space. The process is called eviction.

For choosing what to remove and what to replace with, there's a popular strategy called LRU (least recently used). This means removing the content that has not been accessed for a long time. Suppose we have three movies: movie A, B, and C.

- Movie A was accessed 2 minutes ago by any user or a bunch of users.
- Movie B was accessed 30 seconds ago.
- Movie C was accessed 10 days ago.

According to the comparison, movie C is the least recently used. The cache removes movie C because it hasn't been accessed for the longest time. This is called LRU eviction.

We got the difference. Between TTL and eviction, TTL manages the freshness, and eviction manages the limited storage space. These are different problems. 

We have different approaches for that also. Who will put these copies into the edge servers (the copies of the content)? There are two approaches:

- Pull CDN ( lazy loading ) :- it's called lazy loading because, suppose a new movie is uploaded to Netflix. The edge server does not download it immediately from the origin. It waits until someone or some user requests it.

Like Netflix, Netflix publishes movie A. The edge server doesn't have movie A. The first user requests movie A, then the edge server fetches from the origin. The edge server stores a copy. Future users get it directly because the first user who requested it got this. 

There are both disadvantages and advantages. If I talk about advantages, you don't need to copy every file everywhere. Storage is used for requested content and simple content distribution. 

A disadvantage is that, if I talk about the first request, it can be slow because the edge has to fetch the content. After the first request, the other requests can become faster.

Push CDN ( Preloading ) :-

Suppose Netflix knows that a new season of a popular series will launch this Friday. Netflix expects millions of people to watch it. Suppose Stranger Things' new season is coming, so Netflix expects millions of people to watch it.

Instead of waiting for users to request it, Netflix sends the content to the servers in advance. It prepares the new series. It identifies the location where it expects high demand. Content is distributed to selected edge servers before end users open Netflix on Friday. The content is already available nearby.

This is called push CDN. It is similar to GTA 6, we can say: it's already downloadable to the user, but they access it on the same day when the game got launched. 

Advantages are:

- Content is ready before a user requests it.
- Reduces first request delays.
- Useful for predictable high-demand events.

Disadvantages are:

- Uses storage and bandwidth even before anyone requests the content.
- Requires planning and distribution.

Both pull CDN and push CDN are for different use cases. We can say it depends on how popular the content is .


**What type of content should we cache ?**
Not everything should be cached. Let us understand two categories: static and dynamic. If I talk about static content, static content means content that is identical for everyone or at least can safely be shared:

- images
- videos
- CSS files
- JavaScript files
- app downloads, etc.

Suppose the Netflix logo, right? 

Dynamic and personalized content: imagine you open your banking application, your account balances, suppose 10,000. It shouldn't be the same for another user because it's personalized. It's your account balance, so cache can't be used there.

![[Pasted image 20261124154558.png]]


Blog to read :- 
Netflix Open Connect :-
Netflix has many movies and shows, and millions of people watch them simultaneously. Netflix runs its own CDN called Open Connect. Instead of delivering every video from one central server, Netflix places its own servers close to users that we have talked about before.
Netflix calls these special servers OCAs (Open Connect Appliances). It's basically a big storage box containing Netflix movies.

Netflix places these boxes inside or near the infra of ISPs such as Jio and Airtel. 

So when we watch Netflix, the video can come from a Netflix server located inside the ISP's network, like my ISP network, instead of traveling all the way from the other country. 


See, there is one ISP location, and it has four Netflix servers. Two servers form a cluster or a group of servers working together. 

Every night, Netflix has to decide which movies go to server 1, server 2, server 3, and server 4. This whole thing is called content placement.
 It has three goals:

1. Popular movies should be available where people need them.
2. Traffic should be distributed without overloading one server.
3. Existing movies should not constantly move between servers. ( thats called **Churn** actually )

Churn means unnecessary movement of content between servers. 

So it's like how they detect its unnecessary moments. Think: moving 200 TB of movies every night just because popularity rankings change slightly. That whole process is expensive and wasteful also. 


So they try different things, like:

1. Attempt 1 is consistent hashing.


![[Pasted image 20261124171904.png]]

So you can see, imagine that it is a ring numbered from 0 to 100. 
What does Netflix do?
 It uses the hash function to assign each server a position on the ring, so each server gets the position on the ring. 
 It also hashes every movie onto the same ring.
 A movie belongs to the next server encountered when moving clockwise. 
One more thing is also there: Netflix creates and then uses 1,000 virtual positions per server to distribute content more evenly. Suppose we have 4 servers, so per server it can create 1,000 more positions, so it can distribute the content more evenly. 

So, how is this useful? With consistent hashing, suppose we have four servers and we add a fifth. Only a portion of movies need to move to a new server. 

Most movies remain the same, where they are, so this reduces churn. 

There is also one problem: Netflix servers are not identical. There are two different types of hardware: storage servers and flash servers. Storage servers have more storage, but they are slow to deliver and use spinning disk. Flash servers have less storage, faster delivery, and use SSDs.

Suppose you have two servers, server A and server B. Server A has 200 TB of storage and 40 Gbps speed. Server B has 100 TB of storage and 100 Gbps speed. If we use consistent hashing like the ordinary one, the allocation is based on the distribution of position, not on the actual capabilities of the hardware. This creates two problems. 

Problem 1 :-  is content hole. Imagine a popular movie needs 20 TB of storage, but a particular server only has 18 TB available. That movie cannot fit there. This creates a content placement problem. The cluster might fail to accommodate the content that needs to be available there. 

Problem 2: Uneven traffic. Imagine server B is much faster than server A, but both receive traffic according to the allocation that doesn't reflect the actual delivery speeds or the capability. Server A gets overloaded, or server B has unused capacity. 

The problem is that storage capacity and delivery speeds are different things. 

Netflix tries to do HCA ( Attempt 2 )
HCA is basically a heterogeneous cluster allocation. It's a Netflix solution. Netflix improves the consistent hashing so that servers receive content and traffic according to their actual capabilities.

Basically, here Netflix doesn't treat every server equally. It gives each server a weight, like how much responsibility a server should receive. 

Uses two important ideas:

1. Weighted allocation: A server with more storage gets a larger share of content. A server with higher delivery speed gets a larger share of traffic. It solves two problems: storage is used efficiently, and traffic is distributed according to server speed.
2. Two separate rings: Netflix uses two rings, a popular content ring and a long-tail content ring. The popular content ring handles frequently watched movies and shows (very popular, right?). 
   Long-tail content rendering handles less frequently watched content.

Netflix calculates where the popular content ends and the long-tail content begins. This dividing point is called D, catalog. 

It chooses a cutoff that balances server capacity while minimizing unnecessary content movement when popularity rankings change.


Finally, the explanation is that Netflix developed HCA to improve the content placement across the clusters containing different types of servers. It uses weighted consistent hashing and the separate allocation strategies for popular and less popular content to balance storage utilization, delivery traffic, and the content movement. 

**CDN Trade-offs**

See, CDN makes content delivery faster, but it also introduces new problems. Let's understand them:

1. Staleness (old content): Imagine Netflix changes a movie thumbnail, but the ad server still has that old thumbnail stored. You open Netflix and see the old image. This happens because CDN is serving an outdated copy.Here are two terms: short TTL, long TTL.
![[Pasted image 20261124173309.png]]
- Short TTL: cache content expires quickly, more frequent checks with the origin, but fresher content.
- Long TTL: cache content stays fresh for longer according to cache rules, fewer origin requests, but users might see outdated contents.

**Purging**  :- sometimes Netflix or any other website wants to remove an old cache copy immediately instead of waiting for its TTL to expire. Suppose something came up in an emergency, like to change the thumbnail that they put mistakenly .
 So Netflix updates a movie thumbnail and wants all its servers to stop serving that old thumbnail, so it sends instructions to remove the old cached copies. The challenge is to make sure all the relevant servers receive and apply those instructions. 

2. Money: CDNs cost money. Imagine you run a small website. You use a CDN to deliver images and videos to visitors. The CDN provider charges you based on the factors of the amount of data transfer, the number of requests, and additional services used.

Netflix has millions of users and enormous amounts of video traffic. Running its own CDN infrastructure can make economic sense at that scale, but if you run a small business or have a small website, building thousands of servers around the world would be extremely expensive. So you rent a CDN from these services, like I've told you before: Cloudflare, like my Amazon CloudFront. 


The simplest idea is that small companies rent CDN infra. Companies like Netflix can justify operating their own at massive scale because this makes sense at that scale. 

3. Long-tail, rarely watched content. Imagine Netflix has 10,000 movies. Movie A is watched by 10 lakh people. Movie B is watched by 10 people because it can be an old movie or an unpopular movie, right? So Movie A is more likely to be available in the nearby edge caches. 

    ![[Pasted image 20261124173644.png]]



Some rarely watched movies may not be stored on a nearby server. When someone requests one, it's checked for cache. If the movie isn't available, the edge cache fetches it from the origin or another upstream cache. The movie gets delivered. This is called a cache miss.


Basically, CDN caching is especially effective for popular content. Rarely requested content may still be slow. 

4. Dynamic content, personalized information. You can't use cache for the personalized information because someone has a different shopping cart for a particular app. They have a different shopping cart, right? That can't be shared cache . Specific parts of the websites can still be cached, like static parts, logo images, CSS, and JavaScript. Even a personalized website can benefit from a CDN. More moving parts, more complexity.

Imagine you have just had one server. If something went wrong, you check that server. Now imagine you have 1,000 edge servers. You have to have proper debugging and proper scalability. Also, more servers improve scalability and availability, but also add more operational complexity. 


Let's do a simple exercise in C++: building a mini CDN cache. 

What's our target?

1. Store copies of requested content.
2. Check whether content already exists.
3. If it exists and it's fresh, return it (cache hit).
4. If it doesn't exist or has expired, fetch it from the origin (cache miss).
5. Count hits, misses, and origin requests.

![[Pasted image 20261124174124.png]]
( Simple Architecture )

```
#iniclude <iostream>
#include <unordered_map> //store content using key-value //pairs
#include <string>
using namespace std;

//here unorderedmap is like a dictionary
//movie name is the key and cached data is value

struct Entry {
string data; //actual cached content
int expiresAt; //when that cached content expires
}

class EdgeCache { 

private:

// one physical edge server
   unordered_map<string , Entry>shelf;
   
   list<string> recentlyUsed ; //maintains order in whcih //items are recently used
   
//  frond ->lru
  // back->mru%%
   int ttlseconds ; //controls how long content stays fresh
   
   int hits =0;
   int misses=0;
   int originFetches=0;


string fetchFromOrigin( const string& name ){
originFetches++; //Every time we contact the origin, it //increases the counter by one. 

return  "<" +name + "bytes from origin";
//for eg <darkknight bytes from origin
}
//in above we are simulating , but actually its download the
//actual movie/file.

void updateLRU(string name){

recentlyUsed.remove(name); // Remove its old position from the list if it exists. 
recentlyUsed.push_back(name) // Put it at the back because it's just been used.
}

void evictLRU(){
string lruitem=recentlyUsed.front();
cout <<"Evicting" <<lruitem<<"(LRU)\n";
 recentlyUsed.pop_front();
 shelf.erase(lruitem);


}


public:

EdgeCache(int ttl , int capacity){
ttlSeconds=ttl;
maxSize=capacity;
}


//this below func tells whether to return cached content or
//fetch from the origin
string get(const string& name , int now ){
auto it =shelf.find(name);
 // First, we search for the requested movie in our shelf. // Example: `shelf.find("dark night")` 
 
// if movie exists we get iterator pointing to its entry
// if not the find() returns shelf.end();

if( it != shelf.end() && now <it->second.expiresAt){
hits++;
return it-> second.data + "(HIT served by edge)";

}

else {
misses++ ;
string data =fetchFromOrigin(name);
shelf[name]={data,now +ttlSeconds};

return data + "(MISS,fetched+stored)";
}

if ( it !=shelf.end()){
shelf.erase(it);
recentlyUsed.remove(name);

}
string data=fetchFromOrigin(name);

if(shelf.size() >=maxSize){
evictLRU();

shelf[name]={data,now+ttlSeconds};
recentlyUsed.push_back(name);
return data;
}

void ShowStats(){
// here we can show in output how much is cache hit miss and all stuff

int main() {

EdgeCache mumbai(60,2) 
mumbai.get("A",0);
mumbai.get("b",10);
mumbai.get("C",20);
mumbai.get("A",30);
mumbai.get("B",40);
mumbai.get("C",50);

mumbai.showStats();
return 0;
}

```

Example :

suppose program creates 

EdgeCache mumbai(60);

it makes 5 requests

1. Request at t = 0: movie does not exist, so it is a cache miss. Origin fetches movie, caches, and stores it till expiry time 60.
2. Request: movie at t = 10. t = 10, movie exists. 10 < 60, so hit. Server is directly from edge, 
third request: t = 30. Movie exists, and 30 < 60. It is a hit directly from the edge server.

Then:

4. Movie at t = 70: movie exists, but 70 is not less than 60, so old copy is stale. Fetch again and update expiry to 130.
5. At t = 75: new content. It does not exist in cache, fetches from origin, and stored at. Expiry time becomes 130 if

Now, we can calculate the cache hit ratio. Total requests are 5, cache hits are 2, cache misses are 3, and origin fetches are 3


 2/5 × 100 = 40%, meaning 
 40% of requests were served directly from the cache. 


According to our example, our cache could store unlimited items, but if we talk about real servers, they have limited storage. Let's say our cache can store only two movies. 

What happens? We use LRU (least recently used). 
It's basically when the cache is full and a new movie arrives, remove the movie that has not been accessed for the longest time. 

![[Pasted image 20261124180404.png]]
 This example has a capacity of a maximum of 2 movies. First, A, B: cache full, move to C. A is least recently used, and it gets removed. Similarly, if we do this, we can see the cache can hold only 2 items. Find the request pattern cycles through 3 different items. Every time a new item arrives, LRU removes the item that will be needed next. This is an example of cache thrashing: repeated cache misses caused by a workload that doesn't fit the available cache capacity. 


so this is the end of the today's blog.

