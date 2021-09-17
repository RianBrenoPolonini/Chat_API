const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());

const users = [{
    nick: "Admin",
    email: "admin@admin.com",
    password: crypt.hashSync("123456", 10),
    isAdmin: true,
    id: uuidv4()
}];

const key = 'QNqnF.s78wL*v.2A6!.ifsoGQwoWtCd-zkd_nuDBnKAkc9JdikAAx*6PyaH!NUPaY9cwRF@@HEEa8!x4btU2QuiJrV.F_watN73@KM3_3JwpeyUnvN*gQRRExJwh7jTLcrtCTtL3.UJiGiGd8QaqfCaCD8Un9kq9Nt!_C.XXpUBtnBYeZYyqriX8JvjvMp3rJjUBPmqi8wy3bfVwVz37jd_v7BRAzDijCeh93RJDTUb-axfazY_zQPGUE6f3uiY_uR-qb2qK!WDMstHkph76hTxvcDmZ8p8zNtkewia7oxdmop7H4G@92YkmZgQXVnfC8rcWyn32GWB9!dDh@R2.pnDxc-gUx9ydXjnpo6BbNjp7@njNNmsyGbb_f_6CEu*tpm2WQM!r@Kv2*6bsrh62EiTUA6iM-evMXeqU6P8LN@niJrKAWadDb!F-hpTUv73gMq33_GmKbUbwat92JKptTHpKmsTy7JZ2orXExVZ_PE-nhUeHRnULjdUjHzNgfj!CDZbu_3QUZNu-2mnApPEUCnhH!A@_R8.FXbF4e4WeXdBZLc6nWjc6u8Y4pMDfJsuJmQseWNT!_38V8CVZPZ3dL.i_u8eZwmEZEDEH@jsoLYDBaWABBvu_mmFeJ*D92rKMU!8Vq_KnDBkEmHiCx3*wtkNqdnP2RVRLv3kJNGstcMakUJYqaZC4Nb.2YJYTvtv4JkmXHAH4K2*pbaBbHETDGqYr-pgvsEDHDtNZJ!MWjiT3dp*hyCU_dtU9DKemW@gEDUVTzchujVi7mtiZ8kde_EK4Q4ef4xLJPabPwFJeQfb-6N6eVwX2h*nZqQ.!7-EWyJ!-rkLb_g@w7BDgf-o9t@QxWxG3CDjaq-@Z9pf3ZT!TemTcTCE3-!c2CnPeFte3a4JMsu.@ZvhEYZDj2Y68VUW.p-DksNJx3nKgi26doRnnGG4mx!Jcfiy6b9A-*6Dt*kt7V2qXcA2YhixCX@a@zDYLFpcv-Pes@w9umPTT';

function gerarToken(userId) {
    return jwt.sign({ id: userId }, key, { expiresIn: "3d" });
}

function checkIfUserAuth(req, res, next) {
    const { token } = req.headers;

    if (!token) {
        return res.send({ error: "Token não encontrado!" });
    }

    jwt.verify(token, key, (error, decod) => {
        if (error) {
            return res.send({ error: "Token invalido!" });
        }

        const user = users.find((user) => user.id === decod.id);

        if (!user) {
            return res.status(400).json({ error: "Token invalido!" })
        }

        req.user = user;

        return next();
    });
}

app.post('/user/create', (req, res) => {
    const { email, password, nick } = req.body;

    const existe = users.some(
        (users) => users.email === email || users.nick === nick
    );

    if (existe) {
        return res.status(400).json({ error: "Usuário já existe!" });
    }

    const hash = crypt.hashSync(password, 10);

    users.push({
        nick,
        email,
        password: hash,
        isAdmin: false,
        id: uuidv4()
    });

    return res.status(201).send("Usuário cadastado com sucesso");

});

app.post('/user/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find((user) => user.email === email);

    if (!user) {
        return res.status(400).json({ error: "E-mail invalido!" });
    }

    if (user.isAdmin && user.password === password) {
        res.status(201).json({ token: gerarToken(user.id), user });
    }

    if (crypt.compareSync(password, user.password)) {
        res.status(201).json({ token: gerarToken(user.id), user });
    }

    return res.status(400).json({ error: "Senha invalida!" })
});

app.put('/user/account', checkIfUserAuth, (req, res) => {
    const { nick, email, password } = req.body;
    const { user } = req;

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

    return res.send('Alteração feita com sucesso')

});

app.delete('/user/account', checkIfUserAuth, (req, res) => {
    const { user } = req;

    if (user.isAdmin) {
        const userDelete = users.find((user) => user.id === req.query["id"]);
        userDelete

        users.splice(users.indexOf(userDelete), 1);

        return res.send("Usuário excluido com sucesso!")
    }

    users.splice(users.indexOf(user), 1);


    return res.send("Usuário excluido com sucesso!")

});

app.get('/user/account', checkIfUserAuth, (req, res) => {
    const { user } = req;

    if (user.isAdmin) {
        return res.json(users);
    }

    return res.json(user);
});

app.get('/user/users', (req, res) => {
    return res.json(users);
});

app.listen(3333, (erro) => {
    if (erro) {
        console.log('Deu ruim!')
    } else {
        console.log('Deu bom!')
    }
});