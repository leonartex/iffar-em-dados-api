![logo](/docs/img/logo.svg "IFFar em Dados")

# IFFar em Dados

Este repositório faz parte do projeto IFFar em Dados e representa o seu backend, contando ainda com um [outro repositório, que contém seu frontend](https://github.com/leonartex/iffar-em-dados). Ele foi o tema da minha monografia no bacharelado em Sistemas de Informação, que buscou realizar o processamento de dados abertos ofertados pela instituição, além de outras instituições, para a disponibilização de informações sobre os cursos ofertados e os estudantes que formam a instituição. Apesar de, atualmente, focar as informações nesse aspecto, também existem planos de se cobrir outras áreas posteriormente, que necessita de mais pesquisa, principalmente considerando a complexidade de informar certos temas, como cobrir informações de aspecto financeiro, por exemplo.

## Monografia

A monografia "IFFar em Dados: proposta de portal para transparência institucional" tratou sobre os aspectos da transparência, que afeta a comunicação, e a oferta de informações da instituição. O ponto central do trabalho foi em demonstrar que informações pertinentes sobre o IFFar podem ser ofertadas de maneiras mais práticas apenas com os dados que a própria instituição já deve oferecer por lei, porém, o mesmo também vale para qualquer outra instituição de ensino pública. Para a quem interessar, a monografia está em `docs/monografia.pdf`, contudo, [também poderá ser consultada em meu GitHub Pages pessoal](https://leonartex.github.io/iffar-em-dados/monografia).

## As informações do IFFar em Dados

O IFFar em Dados, atualmente, foca-se apenas em mostrar informações acadêmicas sobre a instituição, utilizando diferentes fontes para tal. Contudo, para realizar o acesso a esses dados, toda uma lógica no acesso às APIs foi criada, como o diagrama abaixo ilustra:
![Diagrama da API de backend interagindo com as fontes de dados da API do IFFar, Nominatim e dados da Plataforma Nilo Peçanha](/docs/img/diagrama-api-back-end.png "IFFar em Dados")

Inicialmente a API do IFFar em Dados (servidor à direita) verifica se já não possui em cache os dados processados (processar os dados, por exemplo, da página inicial consome um tempo considerável, devido ao grande número de requisições enviadas), solicitando o restante dos dados necessários. Novamente, para as requisições de cada API, também é realizada a verificação do cache de requisições anteriormente enviadas (para diminuir o número de requisições) e é realizado o controle do timing das requisições não presentes no cache (para evitar ultrapassar o limite de requisições por minuto de cada API). Após solicitar todos os dados, eles são processados, relacionando-os, para permitir a posterior formulação de informações no frontend.