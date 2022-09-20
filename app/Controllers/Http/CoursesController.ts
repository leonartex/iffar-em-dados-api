// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Curso from "App/Models/iffar/Curso";
import GrausAcademicosController from "./iffar/GrausAcademicosController";

import { string, types } from '@ioc:Adonis/Core/Helpers'
import ModalidadesEducacaoController from "./iffar/auxiliares/ModalidadesEducacaoController";
import MunicipiosController from "./iffar/MunicipiosController";
import UnidadesOrganizacionaisController from "./iffar/UnidadesOrganizacionaisController";
import TiposOfertaCursoController from "./iffar/auxiliares/TiposOfertaCursoController";
import AreasCursoCnpqController from "./iffar/AreasCursoCnpqController";
import EixosConhecimentoController from "./iffar/EixosConhecimentoController";
import PnpMatriculasController from "./pnp/PnpMatriculasController";
import PnpMatricula from "App/Models/PnpMatricula";
import Aluno from "App/Models/iffar/Aluno";
import FormasIngressoController from "./iffar/auxiliares/FormasIngressoController";
import CursosController from "./iffar/CursosController";

import util from 'util';
import AlunosController from "./iffar/AlunosController";

export default class CoursesController {
    public async getAll(){};

    public async getAllFromUnit(unitId: number){};

    public async get(courseId: number){
        let cursosC = new CursosController();
        let course = await cursosC.get(courseId);

        let courseDetailing = await this.courseDetailing(course);
        console.log(util.inspect(courseDetailing));

        let pnpMatriculasC = new PnpMatriculasController();
        let enrollments = await pnpMatriculasC.getCourse(course);
        let rateCards = await this.rateCards(enrollments);
        console.log(util.inspect(rateCards));

        let alunosC = new AlunosController();
        let students = await alunosC.getStudentsFromCourse(course.id_curso, 0, 2020);
        let entryMethods = await this.entryMethods(students);
        console.log(util.inspect(entryMethods));

        let slotReservationOptions = await this.slotReservationOptions(enrollments);
        console.log(util.inspect(slotReservationOptions));

        let studentsProfile = await this.studentsProfile(enrollments);
        console.log(util.inspect(studentsProfile.racialDistribution, undefined, 4));
    };

    private async courseDetailing(course: Curso){
        class CourseDetailing {
            level: string | null;
            degree: string | null;
            modality: string | null;
            city: string | null;
            offerType: string | null;
            knowledgeArea: string | null;
            knowledgeAxis: string | null;
            courseLoad: string | null;
            minimumCourseLoad: string | null;
            turn: string | null;
            courseSlots: string | null;
        }
        let detailing: CourseDetailing = new CourseDetailing();

        /**Definindo:
         * Nível do curso
         * Grau do curso (para cursos técnicos e de pós graduação será chamado de categoria para o usuário)
         */
        switch (course.nivel){
            case 'M':
            case 'N':
                detailing.level = 'Técnico';
                //Testo se tem PROEJA no nome, para diferençar o integrado PROEJA do integrado ao ensino médio
                if(/proeja/.test(course.nome.toLowerCase()))
                    detailing.degree = 'Integrado - PROEJA';
                else
                    detailing.degree = 'Integrado';
                break;
            case 'T':
                detailing.level = 'Técnico';
                detailing.degree = 'Subsequente';
                break;
            case 'L': 
                detailing.level = 'Pós-graduação';
                detailing.degree = 'Lato Sensu';
                break;
            case 'E': 
                detailing.level = 'Pós-graduação';
                detailing.degree = 'Stricto Sensu';
                break;
            case 'F': //Estou supondo que F seja FIC, visto que não possui registro na documentação
                detailing.level = 'Qualificação Profissional (FIC)';
                detailing.degree = null;
                break;
            case 'G':
                detailing.level = 'Graduação';
                
                let grausC = new GrausAcademicosController();
                let grau = await grausC.get(course.id_grau_academico);
                detailing.degree = string.capitalCase(grau.descricao);
                break;
            default:
                detailing.level = null;
                detailing.degree = null;
        }

        //Pego a modalidade do curso (presencial, a distância, etc.)
        let modalidadeC = new ModalidadesEducacaoController();
        let modalidade = await modalidadeC.get(course.id_modalidade_educacao);
        detailing.modality = modalidade.descricao;

        //Pego o município do curso (alguns cursos apresentam o município vazio ou até mesmo errado, então pego a info do município pela unidade do curso)
        let unidadeC = new UnidadesOrganizacionaisController();
        let unidade = await unidadeC.get(course.id_unidade);
        let municipioC = new MunicipiosController();
        let municipio = await municipioC.get(unidade.id_municipio);
        detailing.city = municipio.nome;

        // Pego o tipo de oferta do curso (anual, semestral. Apenas para graduação)
        if(types.isNumber(course.id_tipo_oferta_curso)){
            let tiposOfertaC = new TiposOfertaCursoController();
            let offerType = await tiposOfertaC.get(course.id_tipo_oferta_curso);
            detailing.offerType = offerType.descricao;
        }else{
            detailing.offerType = null;
        }

        // Área do conhecimento e Eixo de conhecimento (técnico)
        if(!types.isNull(course.id_area_curso)){
            let areasCnpqC = new AreasCursoCnpqController();
            let area = await areasCnpqC.get(course.id_area_curso);
            detailing.knowledgeArea = area.nome;
        }else{
            detailing.knowledgeArea = null;
        }

        if(!types.isNull(course.id_eixo_conhecimento)){
            let eixosC = new EixosConhecimentoController();
            let knowledgeAxis = await eixosC.get(course.id_eixo_conhecimento);
            detailing.knowledgeAxis = knowledgeAxis.nome;
        }else{
            detailing.knowledgeAxis = null;
        }
    
        //Informações extraídas dos dados da PNP
        let pnpMatriculasC = new PnpMatriculasController();
        let pnpCourseInfo = await pnpMatriculasC.getCourse(course, true);

        // Carga horária e carga horária mínima
        detailing.courseLoad = pnpCourseInfo[0].cargaHoraria;
        detailing.minimumCourseLoad = pnpCourseInfo[0].cargaHorariaMinima;

        // Turno (noturno, diurno, etc.)
        detailing.turn = pnpCourseInfo[0].turno;

        // Vagas ofertadas
        detailing.courseSlots = pnpCourseInfo[0].vagasOfertadas;

        return detailing;
    }

    private async rates(enrollments: Array<PnpMatricula>){
        //Pego todos os anos base existentes no array de matrículas (https://stackoverflow.com/questions/15125920/how-to-get-distinct-values-from-an-array-of-objects-in-javascript)
        let pnpYears = [...new Set(enrollments.map(enrollment => enrollment.anoBase))];

        pnpYears.forEach(year => {
            
        });
    }

    private async rateCards(enrollments: Array<PnpMatricula>){
        class RateCards{
            enrolledStudents: number;
            incomingStudents: number;
            concludingStudents: {
                concluded: number,
                integralized: number
            };
            dropoutStudents: any
        }
        let cards = new RateCards();

        //Pego o total de alunos matriculados
        cards.enrolledStudents = enrollments.length;

        //Pego o total de alunos ingressantes
        cards.incomingStudents = enrollments.reduce(function (total, enrollment){
            //Pego a data e divido em três partes, para selecionar o ano
            let [day, month, year] = enrollment.dataDeInicioDoCiclo.split('/');            
            //Verifico se o ano base da PNP é o mesmo que o ano do início da matrícula. Se for, adiciono mais 1 no total
            return (enrollment.anoBase == year) ? ++total : total;
        }, 0);
        
        cards.concludingStudents = {
            //Pego o total de alunos que concluíram o curso
            concluded: enrollments.reduce(function(total, enrollment){
                return enrollment.situacaoDeMatricula == 'Concluída' ? ++total : total;
            }, 0),
            //Pego o total de alunos que estão com a matrícula do curso integralizada (falta apenas TCC, estágio, etc.)
            integralized: enrollments.reduce(function(total, enrollment){
                return enrollment.situacaoDeMatricula == 'Integralizada' ? ++total : total;
            }, 0)
        };

        //Pego o total de estudantes evadidos
        cards.dropoutStudents = {
            //Matrículas desligadas
            discontinued: enrollments.reduce(function(total, enrollment){
                return enrollment.situacaoDeMatricula == 'Desligada' ? ++total : total;
            }, 0),
            //Matrículas canceladas
            cancelled: enrollments.reduce(function(total, enrollment){
                return enrollment.situacaoDeMatricula == 'Cancelada' ? ++total : total;
            }, 0),
            //Matrículas abandonadas
            abandoned: enrollments.reduce(function(total, enrollment){
                return enrollment.situacaoDeMatricula == 'Abandono' ? ++total : total;
            }, 0),
            //Matrículas reprovadas (o aluno que está impossibilitado de continuar no curso e reprovou em alguma coisa)
            reproved: enrollments.reduce(function(total, enrollment){
                return enrollment.situacaoDeMatricula == 'Reprovado' ? ++total : total;
            }, 0),
            //Estudantes que realizaram transferência externa
            externalTransfer: enrollments.reduce(function(total, enrollment){
                return enrollment.situacaoDeMatricula == 'Transf. externa' ? ++total : total;
            }, 0),
            //Estudantes que realizaram transferência interna
            internalTransfer: enrollments.reduce(function(total, enrollment){
                return enrollment.situacaoDeMatricula == 'Transf. interna' ? ++total : total;
            }, 0)
        };

        return cards;
    }

    private async entryMethods(students: Array<Aluno>){
        //Pego a lista com todas as formas de ingresso
        let formasIngressoC = new FormasIngressoController();
        let entryMethodsList = await formasIngressoC.getAll();

        //Crio o vetor de contagem, que armazenará os dados sobre a quantia de alunos que ingressaram de determinada forma
        let entryMethods: Array<{
            entryMethodId: number | undefined;
            entryMethodDescription: string | undefined;
            total: number;
        }> = [];
        //Depois percorro toda a lista de estudantes para realizar a contagem de alunos e suas formas de ingresso
        students.forEach(student => {
            //Verifico se a forma de ingresso já está presente no array de contagem através do id, se não estiver, adiciono ele para o array
            if(types.isUndefined(entryMethods.find(entryMethod => entryMethod.entryMethodId == student.id_forma_ingresso))){
                //Pego os dados da forma de ingresso que será adicionada no array de contagem
                let entryMethodData = entryMethodsList.find(entryMethod => entryMethod.id_forma_ingresso == student.id_forma_ingresso);
                
                let entryMethod = {
                    entryMethodId: entryMethodData?.id_forma_ingresso,
                    entryMethodDescription: entryMethodData?.descricao,
                    total: 1 //O aluno atual que está sendo contabilizado
                }
                entryMethods.push(entryMethod)
            }else{
                //Pego o índice da forma de ingresso no vetor de contagem
                let entryMethodIndex = entryMethods.findIndex(entryMethod => entryMethod.entryMethodId == student.id_forma_ingresso);
                //Adiciono mais 1 no total
                entryMethods[entryMethodIndex].total++;
            }
        });

        return entryMethods;
    }

    private async slotReservationOptions(enrollments: Array<PnpMatricula>){
        //Pego a primeira matrícula ingressante que aparecer (aparentemente, a PNP adiciona os dados sobre opções de reserva de vaga ofertadas conforme o ano de ingresso de determinada matrícula, assim, torna-se necessário recuperar uma matrícula ingressante)
        //Já que eu executo as funções respectivamente a cada um dos anos bases disponíveis da PNP, retornar a primeira matrícula ingressante é o suficiente pois o conjunto de matrículas já estará filtrado desde antes, assim, conseguindo os dados de todos os anos
        let incomingEnrollment = enrollments.find(enrollment => {
            //Comparo o ano de início da matrícula com o ano base da PNP para definir se é uma matrícula ingressante
            let [day, month, year] = enrollment.dataDeInicioDoCiclo.split('/');
            return enrollment.anoBase == year ? true : false
        })
        // let incomingEnrollment = function(){
        //     for(let i = 0; i < enrollments.length; i++){
        //         let [day, month, year] = enrollments[i].dataDeInicioDoCiclo.split('/');
        //         if(enrollments[i].anoBase == year)
        //             return enrollments[i]
        //     }

        //     return null;
        // }();

        //Com os dados da mátricula ingressante, apenas adiciono os valores sobre cada tipo de vaga ofertada
        let slotReservationOptions = {
            regular: {
                ac: incomingEnrollment?.vagasRegularesAc,
                l1: incomingEnrollment?.vagasRegularesL1,
                l2: incomingEnrollment?.vagasRegularesL2,
                l5: incomingEnrollment?.vagasRegularesL5,
                l6: incomingEnrollment?.vagasRegularesL6,
                l9: incomingEnrollment?.vagasRegularesL9,
                l10: incomingEnrollment?.vagasRegularesL10,
                l13: incomingEnrollment?.vagasRegularesL13,
                l14: incomingEnrollment?.vagasExtraordinariasAc
            },
            extraordinary: {
                ac: incomingEnrollment?.vagasExtraordinariasAc,
                l1: incomingEnrollment?.vagasExtraordinariasL1,
                l2: incomingEnrollment?.vagasExtraordinariasL2,
                l5: incomingEnrollment?.vagasExtraordinariasL5,
                l6: incomingEnrollment?.vagasExtraordinariasL6,
                l9: incomingEnrollment?.vagasExtraordinariasL9,
                l10: incomingEnrollment?.vagasExtraordinariasL10,
                l13: incomingEnrollment?.vagasExtraordinariasL13,
                l14: incomingEnrollment?.vagasExtraordinariasL14
            }
        };

        return slotReservationOptions;

    }

    //Semelhante aos painéis da PNP apresentados, os conjuntos de dados sobre o perfil dos estudantes serão um tanto relacionados entre si. No caso, a estrutura de dados seguirá de uma forma em que dados sobre renda familiar serão relacionados com dados sobre cor de pele/raça, assim como dados sobre distribuição por gênero possuirão ligação com os dados sobre faixa etária
    //Por exemplo, cada valor de idade será interseccionado entre as alternativas de gênero contidas na PNP. Já as alternativas de cor de pele/raça, de forma semelhante, conterão a intersecção para cada tipo de renda per capita familiar. Isso é necessário para permitir maiores inferências no futuro, porém, sem tornar o conjunto de dados muito grande ou complexo de se trabalhar no lado do usuário.
    //A título de comparação, se eu utilizasse os dados com um menor nível de granularidade, realizando as combinações de Cor, Renda, Idade e Gênero, haveriam 1496 registros diferentes para realizar a contagem considerando todas essas intersecções, enquanto que limitar a intersecção entre Cor e Renda (40 combinações) e Idade e Gênero (134 combinações) tornam os dados muito menores
    private async studentsProfile(enrollments: Array<PnpMatricula>){
        let ageGroupsDistribution: Array<{
            age: string, //O valor da idade (ex.: 19 == 19 anos)
            genderDistribution: Array<{
                description: string, //O nome que será utilizado para apresentação.
                total: number //O total de estudantes
            }>
        }> = [];

        let racialDistribution: Array<{
            description: string, //A descrição da cor ou raça
            income: Array<{
                description: string, //A descrição da faixa de renda familiar per capita
                total: number
            }>
        }> = [];

        enrollments.forEach(student => {
            //Primeiro faço as verificações para registrar os dados sobre idade e distribuição de gênero
            //Verifico se a idade não existe no vetor, para adicionar ela
            if(types.isUndefined(ageGroupsDistribution.find(ageGroup => ageGroup.age == student.idade))){
                //Se a idade não existe no vetor, a distribuição por gênero também não existe, então posso adicionar esses valor diretamente sem verificações
                ageGroupsDistribution.push({
                    age: student.idade,
                    genderDistribution: [{
                        description: student.sexo,
                        total: 1
                    }]
                })
            }else{
                //Agora, se a idade já está cadastrada, preciso fazer as verificações para o gênero

                //Pego o índice da idade no vetor
                let ageIndex = ageGroupsDistribution.findIndex(ageGroup => ageGroup.age == student.idade);
                
                //Com o índice em mãos, faço a procura pelo gênero
                if(types.isUndefined(ageGroupsDistribution[ageIndex].genderDistribution.find(gender => gender.description == student.sexo))){
                    ageGroupsDistribution[ageIndex].genderDistribution.push({
                        description: student.sexo,
                        total: 1
                    })
                }else{
                    //Se o gênero já estiver registrado, apenas adiciono +1 no total
                    let genderIndex = ageGroupsDistribution[ageIndex].genderDistribution.findIndex(gender => gender.description == student.sexo);
                    ageGroupsDistribution[ageIndex].genderDistribution[genderIndex].total++;
                }
            }

            //Agora, as verificações para registro de dados sobre cor/raça e renda familiar
            if(types.isUndefined(racialDistribution.find(racialGroup => racialGroup.description == student.corRaca))){
                racialDistribution.push({
                    description: student.corRaca,
                    income: [{
                        description: student.rendaFamiliar,
                        total: 1
                    }]
                })
            }else{
                let raceGroupIndex = racialDistribution.findIndex(racialGroup => racialGroup.description == student.corRaca);

                if(types.isUndefined(racialDistribution[raceGroupIndex].income.find(income => income.description == student.rendaFamiliar))){
                    racialDistribution[raceGroupIndex].income.push({
                        description: student.rendaFamiliar,
                        total: 1
                    })
                }else{
                    let incomeIndex = racialDistribution[raceGroupIndex].income.findIndex(income => income.description == student.rendaFamiliar);
                    racialDistribution[raceGroupIndex].income[incomeIndex].total++;
                }
            }
        });

        return {ageGroupsDistribution, racialDistribution};

    }

}
