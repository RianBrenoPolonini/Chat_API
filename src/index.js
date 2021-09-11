const express = require('express');
const { v4: uuid4 } = require('uuid');

const app = express();

app.use(express.json());

const users = [];
const mensagens = [];

function checkIfUserExiste(req, resp, next){
    const {email} = req.headers;
    const user = users.find((user) => user.email === email);

    if (!user){
        return resp.status(400).json({error: "Usuário não existe!"});
    }

    req.user = user;

    return next();
}

function checkIfMensagemExiste(req, resp, next){
    const {id} = req.body;

    const mensagem = mensagens.find((mensagem) => mensagem.id === id);

    if (!mensagem){
        return resp.status(400).json({error: "Mensagem não existe!"});
    }

    req.mensagem = mensagem;

    return next();
}

app.post("/account", (req, resp) => {
    const {nick, email} = req.body;

    const nickExiste = users.some(
        (users) => users.nick === nick
    );

    const emailExiste = users.some(
        (users) => users.email === email
    );

    if(nickExiste || emailExiste){
        return resp.status(400).json({ error: "Usuário já existe!"});
    }

    users.push({
        email,
        nick,
        id: uuid4()
    });

    return resp.status(201).send("Usuário cadastrado com sucesso!")
});

app.put("/account", checkIfUserExiste, (req, resp) => {
    const {nick} = req.body;
    const {user} = req;

    user.nick = nick;

    return resp.status(201).send("Nick alterado com sucesso!");
});

app.delete("/account", checkIfUserExiste, (req, resp) => {
    const {user} = req;

    users.splice(user,1);

    return resp.status(200).json(users)
});

app.get("/users", (req, resp) => {
    return resp.json(users);
});

app.post("/mensagens", checkIfUserExiste, (req, resp) => {
    const {mensagem} = req.body;
    const {user} = req;

    mensagens.push({
        mensagem,
        user_id: user.id,
        data: new Date(),
        id: uuid4()
    });

    return resp.status(201).send("Mensagem enviada com sucesso!")
});

app.put("/mensagens", checkIfUserExiste, checkIfMensagemExiste, (req, resp) => {
    const {nova_mensagem} = req.body;
    const {user, mensagem} = req;

    if(user.id !== mensagem.user_id){
        return resp.status(400).json({error: "Você não pode alterar mensagens de outra pessoa"});
    }

    mensagem.mensagem = nova_mensagem;

    return resp.status(201).send("Mensagem alterado com sucesso!");
});

app.delete("/mensagens", checkIfUserExiste, checkIfMensagemExiste, (req, resp) => {
    const {user, mensagem} = req;

    if(user.id !== mensagem.user_id){
        return resp.status(400).json({error: "Você não pode alterar mensagens de outra pessoa"});
    }

    mensagens.splice(mensagem,1);

    return resp.status(200).json(mensagens)
});

app.get("/mensagens", (req, resp) => {
    return resp.json(mensagens);
});

app.listen(3333, (erro) => {
    if (erro){
        console.log("Deu ruim!");
    }else{
        console.log("Deu bom!");
    }
});
