# Rinha Backend - Solução para o Desafio de 2024/Q1

Este repositório contém a solução para o desafio [Rinha de Backend - 2024/Q1](https://github.com/zanfranceschi/rinha-de-backend-2024-q1), focado em compartilhar conhecimento através de um desafio prático. A edição deste ano aborda o controle de concorrência com ênfase em operações de crédito e débito (crébitos), inspirado por discussões na comunidade de desenvolvimento.

## Sobre o Desafio

O desafio consiste em desenvolver uma API HTTP capaz de gerenciar transações de crédito e débito para clientes, garantindo a consistência dos saldos em relação aos limites estabelecidos. Além disso, a API deve fornecer um extrato das últimas transações realizadas pelo cliente.

### Endpoints Implementados

- **POST /clientes/[id]/transacoes**: Registra uma nova transação (crédito ou débito) para o cliente especificado.
- **GET /clientes/[id]/extrato**: Retorna o extrato contendo o saldo atual, limite e as últimas transações do cliente.

### Regras Específicas

- Transações de débito não podem reduzir o saldo do cliente abaixo do seu limite.
- Requisições que resultariam em saldo inconsistente devem retornar HTTP 422.
- IDs de clientes inexistentes devem retornar HTTP 404.

## Tecnologias Utilizadas

- **Linguagem de Programação**: Node.js com TypeScript e uWebSockets.
- **Banco de Dados**: PostgreSQL.
- **Conteinerização**: Docker e Docker Compose.

## Como Usar

Para executar a solução localmente, siga os passos abaixo:

1. Clone o repositório:
   ```bash
   git clone https://github.com/itujo/rinha-backend.git
   ```
2. Navegue até o diretório do projeto e execute com Docker Compose:
   ```bash
   cd rinha-backend
   docker-compose up --build
   ```

## Arquitetura

A solução adota uma arquitetura que inclui um balanceador de carga (Load Balancer) para distribuir as requisições entre duas instâncias da aplicação, garantindo a escalabilidade e a disponibilidade do serviço. O banco de dados PostgreSQL é utilizado para persistência dos dados, com esquemas e tabelas otimizados para operações de alta concorrência.

## Contribuições

Contribuições para a solução são bem-vindas! Se você tem sugestões de melhorias, correções ou novas funcionalidades, sinta-se à vontade para abrir uma issue ou enviar um pull request.

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.