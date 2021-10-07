const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());
const port = process.env.PORT || 3333;

const users = [{
    id: uuidv4(),
    nick: "Admin",
    email: "admin@admin.com",
    password: crypt.hashSync("123456", 10),
    isAdmin: true
}];

const mensagens = [];

const key = 'QNqnF.s78wL*v.2A6!.ifsoGQwoWtCd-zkd_nuDBnKAkc9JdikAAx*6PyaH!NUPaY9cwRF@@HEEa8!x4btU2QuiJrV.F_watN73@KM3_3JwpeyUnvN*gQRRExJwh7jTLcrtCTtL3.UJiGiGd8QaqfCaCD8Un9kq9Nt!_C.XXpUBtnBYeZYyqriX8JvjvMp3rJjUBPmqi8wy3bfVwVz37jd_v7BRAzDijCeh93RJDTUb-axfazY_zQPGUE6f3uiY_uR-qb2qK!WDMstHkph76hTxvcDmZ8p8zNtkewia7oxdmop7H4G@92YkmZgQXVnfC8rcWyn32GWB9!dDh@R2.pnDxc-gUx9ydXjnpo6BbNjp7@njNNmsyGbb_f_6CEu*tpm2WQM!r@Kv2*6bsrh62EiTUA6iM-evMXeqU6P8LN@niJrKAWadDb!F-hpTUv73gMq33_GmKbUbwat92JKptTHpKmsTy7JZ2orXExVZ_PE-nhUeHRnULjdUjHzNgfj!CDZbu_3QUZNu-2mnApPEUCnhH!A@_R8.FXbF4e4WeXdBZLc6nWjc6u8Y4pMDfJsuJmQseWNT!_38V8CVZPZ3dL.i_u8eZwmEZEDEH@jsoLYDBaWABBvu_mmFeJ*D92rKMU!8Vq_KnDBkEmHiCx3*wtkNqdnP2RVRLv3kJNGstcMakUJYqaZC4Nb.2YJYTvtv4JkmXHAH4K2*pbaBbHETDGqYr-pgvsEDHDtNZJ!MWjiT3dp*hyCU_dtU9DKemW@gEDUVTzchujVi7mtiZ8kde_EK4Q4ef4xLJPabPwFJeQfb-6N6eVwX2h*nZqQ.!7-EWyJ!-rkLb_g@w7BDgf-o9t@QxWxG3CDjaq-@Z9pf3ZT!TemTcTCE3-!c2CnPeFte3a4JMsu.@ZvhEYZDj2Y68VUW.p-DksNJx3nKgi26doRnnGG4mx!Jcfiy6b9A-*6Dt*kt7V2qXcA2YhixCX@a@zDYLFpcv-Pes@w9umPTT';

function gerarToken(userId) {
    return jwt.sign({ id: userId }, key, { expiresIn: "3d" });
}

function checkIfUserAuth(req, res, next) {
    const { token } = req.headers;

    if (!token) {
        return res.status(401).json({ error: "Token não informado"});
    }

    jwt.verify(token, key, (error, decod) => {
        if (error) {
            return res.status(401).json({ error: "Token invalido"});
        }

        const user = users.find((user) => user.id === decod.id);

        if (!user) {
            return res.status(403).json({ error: "Token não existente"});;
        }

        req.user = user;

        return next();
    });
}

app.post('/user/create', (req, res) => {
    const { email, password, nick } = req.body;

    if (!email || !password || !nick){
        return res.status(400).json({ error: "Preencha todas as informações"});
    }

    const existe = users.some(
        (users) => users.email === email || users.nick === nick
    );

    if (existe) {
        return res.status(400).json({ error: "E-mail ou Nick já existem"});
    }

    const hash = crypt.hashSync(password, 10);

    users.push({
        id: uuidv4(),
        nick,
        email,
        password: hash,
        isAdmin: false
    });

    return res.status(201).json({ mensagem: "Usuário cadastrato com sucesso"});

});

app.post('/user/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find((user) => user.email === email || user.nick === email);
    

    if (!user) {
        return res.status(400).json({ error: "Usuário não existe"});
    }

    if (crypt.compareSync(password, user.password)) {
       return res.status(200).json({ token: gerarToken(user.id) });
    }

    return res.status(400).json({ error: "Senha incorreta"});
});

app.put('/user/account', checkIfUserAuth, (req, res) => {
    const { nick, email, password } = req.body;
    const { user } = req;

    if (!nick && !email && !password) {
        return res.status(400).json({ error: "Usuário não passou nasa para alterar"});
    }

    if (nick) {
        user.nick = nick;
    }

    if (email) {
        user.email = email;
    }

    if (password) {
        const hash = crypt.hashSync(password, 10);

        user.password = hash;
    }

    return res.status(200).json({ mensagem: "Alteração feita com sucesso"});

});

app.delete('/user/account', checkIfUserAuth, (req, res) => {
    const { user } = req;

    if (user.isAdmin) {
        const userDelete = users.find((user) => user.id === req.query["id"]);
        userDelete

        users.splice(users.indexOf(userDelete), 1);

        return res.status(200)
    }

    users.splice(users.indexOf(user), 1);


    return res.status(200)

});

app.get('/user/account', checkIfUserAuth, (req, res) => {
    const { user } = req;

    if (user.isAdmin) {
        return res.json(users);
    }

    return res.json(user);
});

app.get('/user/users', (req, res) => {
    // const ipCliente = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    return res.json(users);
});

// Mensagens

app.get('/mensagens', checkIfUserAuth, (req, res) => {
    const { user } = req;
    return res.json(mensagens);
});

app.post('/mensagens', checkIfUserAuth, (req, res) => {
    const { user } = req;
    const { mensagem } = req.body;

    mensagens.push({
        id: uuidv4(),
        mensagem,
        data: new Date(),
        user_id: user.id
    });

    return res.json(mensagens);
});

app.delete('/mensagens', checkIfUserAuth, (req, res) => {
    const { user } = req;
    const { id } = req.body;

    const mensagemDelete = mensagens.find((mensagemDelete) => mensagemDelete.id === id);

    if(!mensagemDelete){
        return res.status(401).json({ error: "ID da mensagem não existe!"});
    }

    if (user.isAdmin) {
        mensagens.splice(mensagens.indexOf(mensagemDelete), 1);
        
        return res.status(200)
    }

    if(user.id !== mensagemDelete.user_id){
        return res.status(401).json({ error: "Você não pode apagar a mensagem de outro usuário!"});
    }

    mensagens.splice(mensagens.indexOf(mensagemDelete), 1);

    return res.status(200)

});




app.listen(port, (erro) => {
    if (erro) {
        console.log('Deu ruim!')
    } else {
        console.log('Deu bom!')
    }
});
