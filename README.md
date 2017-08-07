# seneca-cli

Notice: This repo is currently still meant for specific use case. Future development have been planned but not implemented yet. 

## Install
```
npm install seneca-cli -g
```

## Run
```
$ seneca-cli

seneca-cli$
seneca-cli$ set-url amqp://admin:admin@localhost:5672
set url successful amqp://admin:admin@localhost:5672

seneca-cli$ set-pin foo:bar
set pin successful foo:bar

seneca-cli$ act foo:bar,cmd:foobarcmd "{name:bar}"
{ 
    status: true, 
    ...
    ...
    /// return value from seneca call ///
}
 
```



