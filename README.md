# GraphQL API

GraphQL playground test

Run a query like so
```
query {
  movies {
    title
    rating
  }
}
```

run a mutation like so:

```
mutation {
   addActor(actor:{name:"Harry", id:"949494", movies:[{title:"big love"},{title:"alien"}]}) {
    name
    id
    movies {
      title
    }
  }
}
```
