
const { response } = require("express");
const express = require("express");
const {v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());
const customers = [];

//Middleware
function verifyIfExistsAccountCPF(request, response, next){ //função para verificar se o cpf já existe
    const { cpf } = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer){
        return response.status(400).json({error: "Customer not found"});
    }

    request.customer = customer;
    return next();
}
/**
 * CPF -  string
 * name - string
 * id -   uuid
 * statement [] 
 */

function getBalance(statement){
    const balance = statement.reduce((acc, operation) =>{
        if(operation.type ==="credit"){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    }, 0);
    return balance;
}

//Criando a conta
app.post("/account",(request, response)=>{
    const { cpf, name } = request.body; /*Pegando o Cpf e nome*/

    const customerAlreadyExists = customers.some( // ação que verifica se o cpf já existe
        (customer) => customer.cpf === cpf);
    
    if (customerAlreadyExists){ //if para que se o cpf já estiver cadastrado retorne uma mensagem de erro.
        return response.status(400).json({error: "Customer already exists!"});
    } 
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });
     return response.status(201).send();

});

//app.use(verifyIfExistsAccountCPF);
//Buscar Extrato do Client
app.get("/statement", verifyIfExistsAccountCPF, (request, response)=> {
 const { customer } = request;
    return response.json(customer.statement);
});
//Realizando o deposito em conta 
app.post("/deposit", verifyIfExistsAccountCPF, (request, response)=>{
    const { description, amount } = request.body;

    const { customer} = request;

    const statementOperation = {
        description, //Descrição
        amount, // valor do seposito
        created_at: new Date(), //data do deposito
        type: "credit", //tipo crédito
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();

});
//Fazendo o saque da conta
app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) =>{
    const {amount} = request.body;
    const {customer} = request;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({error: "Insuficiente Funds!"});
    };

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    };
    customer.statement.push(statementOperation);

    return response.status(201).send();
});
//Buscando o extrato da conta por data
app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const {date} = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement) => statement.created_at.toDateString() === 
        new Date(dateFormat).toDateString()
        );
       
        return response.json(statement);
       

});
//Alterando o nome da conta no servidor com o metodo PUT
app.put("/account", verifyIfExistsAccountCPF, (request, response)=>{
   const {name} = request.body;
   const {customer} = request;
   customer.name = name;

   return response.status(201).send()
});
//Verificando os dados para ter a certeza de que o update deu certo.
app.get("/account",verifyIfExistsAccountCPF, (request, response)=>{
    const {customer} = request;

    return response.json(customer);
});

//deletar a conta
app.delete("/account", verifyIfExistsAccountCPF, (request, response)=>{
    const {customer} = request;

    // splice
    customers.splice(customer, 1);

    return response.status(200).json(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (request, response)=>{
    const {customer} = request;
    const balance = getBalance(customer.statement);

    return response.json(balance);
});

app.listen(5000);{
    console.log('Server is Running Up')
}