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
import Projeto from "App/Models/iffar/Projeto";
import TiposProjetosController from "./iffar/TiposProjetosController";
import MembrosProjetosController from "./iffar/principais/MembrosProjetosController";
import ProjetosController from "./iffar/ProjetosController";
import GrupoPesquisa from "App/Models/iffar/principais/GrupoPesquisa";
import GruposPesquisasController from "./iffar/principais/GruposPesquisasController";
import MembrosGruposPesquisaController from "./iffar/principais/MembrosGruposPesquisaController";
import LinhasGruposPesquisaController from "./iffar/principais/LinhasGruposPesquisaController";
import ComponentesCurricularesController from "./iffar/principais/ComponentesCurricularesController";
import StringService from "App/Services/stringService";
import EixoConhecimento from "App/Models/iffar/EixoConhecimento";
import AreaCursoCnpq from "App/Models/iffar/AreaCursoCnpq";
import UnidadesFederativasController from "./iffar/UnidadesFederativasController";
import Redis from "@ioc:Adonis/Addons/Redis";
import UnidadeOrganizacional from "App/Models/iffar/UnidadeOrganizacional";
import Unit from "App/Models/Unit";
import LocationsController from "./LocationsController";

export default class PagesController {
    public async teste() {
        let unitsC = new UnidadesOrganizacionaisController();
        //Pego a lista de todas as unidades organizacionais para poder filtrar e localizar a unidade de ensino (campus ou campus avançado) que representa o parâmetro unitCity
        let educationalUnits = await unitsC.getEducationalUnits();

        let units = await this.mountUnits([educationalUnits[0]], true);

        // let map = await this.getMap();
        return units;
    }

    public async getAll(ignoreCache = false) {
        if (!ignoreCache) {
            let responseCache = await Redis.get('iffar-em-dados:iffar');
            if (responseCache) {
                return responseCache;
            }
        }

        let unitsC = new UnidadesOrganizacionaisController();
        let educationalUnits = await unitsC.getEducationalUnits();

        let units = await this.mountUnits(educationalUnits, true);
        let map = await this.getMap();

        let cursosC = new CursosController();
        let apiCourses = await cursosC.getAll();

        let pnpMatriculasC = new PnpMatriculasController();
        let enrollments = await pnpMatriculasC.getAll();

        let alunosC = new AlunosController();
        let students = await alunosC.getStudents();

        //Pego os dados de projetos acadêmicos da unidade de ensino
        const projetosC = new ProjetosController();
        let projects = await projetosC.getAll();

        //Crio o vetor com a lista de anos que terão de informação
        let infoPerYear: Array<any> = [];

        //Pego os anos que existem de dados da PNP
        let pnpYears = [...new Set(enrollments.map(enrollment => enrollment.anoBase))];

        for (let pnpYear of pnpYears) {
            //Filtro as matrículas e estudantes
            let yearEnrollments = enrollments.filter(enrollment => enrollment.anoBase == pnpYear);
            let yearStudents = students.filter(student => student.ano_ingresso.toString() == pnpYear);

            let coursesInfo = await this.coursesInfo(apiCourses, yearStudents, yearEnrollments);

            //Filtro os projetos
            let yearProjects = projects.filter(project => project.ano.toString() == pnpYear)

            let projectsInfo = await this.projectsInfo(yearProjects);

            let rateCards = await this.rateCards(yearEnrollments, yearStudents);
            let entryMethods = await this.entryMethods(yearStudents);
            let slotReservationOptions = await this.slotReservationOptions(yearEnrollments);
            let studentsProfile = await this.studentsProfile(yearEnrollments)

            infoPerYear.push({
                year: pnpYear,
                coursesInfo,
                projectsInfo,
                entryAndProgressInfo: {
                    rateCards,
                    entryMethods,
                    slotReservationOptions,
                },
                studentsProfile
            })
        }

        let apiYears = [...new Set(students.map(student => student.ano_ingresso.toString()))]
        //Removo os anos já cobertos no processamento dos dados da PNP
        apiYears = apiYears.filter(apiYear => types.isUndefined(pnpYears.find(pnpYear => pnpYear == apiYear)));
        for (let apiYear of apiYears) {
            //Filtro os estudantes
            let yearEnrollments = null;
            let yearStudents = students.filter(student => student.ano_ingresso.toString() == apiYear);

            let coursesInfo = await this.coursesInfo(apiCourses, yearStudents, yearEnrollments);

            //Filtro os projetos
            let yearProjects = projects.filter(project => project.ano.toString() == apiYear);
            let projectsInfo = await this.projectsInfo(yearProjects);

            //Preencho com null as informações que dependem dos dados da PNP
            let rateCards = {
                enrolledStudents: null,

                apiIncomingStudents: yearStudents.length,
                pnpIncomingStudents: null,

                concludingStudents: {
                    concluded: null,
                    integralized: null
                },
                dropoutStudents: null
            }
            let entryMethods = await this.entryMethods(yearStudents);
            let slotReservationOptions = null;
            let studentsProfile = null;

            infoPerYear.push({
                year: apiYear,
                coursesInfo,
                projectsInfo,
                entryAndProgressInfo: {
                    rateCards,
                    entryMethods,
                    slotReservationOptions,
                },
                studentsProfile
            })
        }

        let response = {
            "map": map,
            "units": units,
            "infoPerYear": infoPerYear
        }

        let keyName = 'iffar-em-dados:iffar';
        let baseTime = 2 * 24 * 60 * 60;
        await Redis.set(keyName, JSON.stringify(response))
        await Redis.expire(keyName, baseTime)

        return response;
    };

    public async getUnit(unitCity: string, ignoreCache = false) {
        if (!ignoreCache) {
            let responseCache = await Redis.get(`iffar-em-dados:campus:${StringService.urlFriendly(unitCity)}`);
            if (responseCache) {
                return responseCache;
            }
        }

        let unitsC = new UnidadesOrganizacionaisController();
        //Pego a lista de todas as unidades organizacionais para poder filtrar e localizar a unidade de ensino (campus ou campus avançado) que representa o parâmetro unitCity
        let educationalUnits = await unitsC.getEducationalUnits();

        //Filtro para pegar a unidade de ensino (campus ou campus avançado). O esperado é que unitCity já venha no formato de urlFriendly, porém, por segurança, o atributo também é formatado pelo método
        let theUnit = educationalUnits.find(unit => StringService.urlFriendly(unit.city.nome) == StringService.urlFriendly(unitCity) && (unit.type == 'campus' || unit.type == 'advanced-campus'));

        //FAZ um IF aqui para retornar erro se não encontrar a unidade
        if (types.isUndefined(theUnit)) {
            console.log('Undefined?')
            console.log(util.inspect(educationalUnits));
        } else {
            let units = await this.mountUnits([theUnit], true);

            //Pego todos os cursos da unidade
            let cursosC = new CursosController();
            let apiCourses = await cursosC.getAllFromUnit(theUnit);

            //Sigo a lógica bem semelhante de getCourse()
            //Pego as matrículas equivalente da PNP do curso sendo requisitado
            let pnpMatriculasC = new PnpMatriculasController();
            let enrollments = await pnpMatriculasC.getUnit(theUnit);
            //E pego os dados de alunos da unidade da API dos dados abertos do IFFar (em determinadas partes necessito de ambos os dados)
            let alunosC = new AlunosController();
            let students = await alunosC.getStudentsFromCourses(apiCourses.map(course => course.id_curso));

            //Pego os dados de projetos acadêmicos da unidade de ensino
            const projetosC = new ProjetosController();
            let projects = await projetosC.getFromUnit(theUnit);

            //Crio o vetor com a lista de anos que terão de informação
            let infoPerYear: Array<any> = [];

            //Pego os anos que existem de dados da PNP
            let pnpYears = [...new Set(enrollments.map(enrollment => enrollment.anoBase))];

            for (let pnpYear of pnpYears) {
                //Filtro as matrículas e estudantes
                let yearEnrollments = enrollments.filter(enrollment => enrollment.anoBase == pnpYear);
                let yearStudents = students.filter(student => student.ano_ingresso.toString() == pnpYear);

                let coursesInfo = await this.coursesInfo(apiCourses, yearStudents, yearEnrollments);

                //Filtro os projetos
                let yearProjects = projects.filter(project => project.ano.toString() == pnpYear)

                let projectsInfo = await this.projectsInfo(yearProjects);

                let rateCards = await this.rateCards(yearEnrollments, yearStudents);
                let entryMethods = await this.entryMethods(yearStudents);
                let slotReservationOptions = await this.slotReservationOptions(yearEnrollments);
                let studentsProfile = await this.studentsProfile(yearEnrollments)

                infoPerYear.push({
                    year: pnpYear,
                    coursesInfo,
                    projectsInfo,
                    entryAndProgressInfo: {
                        rateCards,
                        entryMethods,
                        slotReservationOptions,
                    },
                    studentsProfile
                })
            }

            let apiYears = [...new Set(students.map(student => student.ano_ingresso.toString()))]
            //Removo os anos já cobertos no processamento dos dados da PNP
            apiYears = apiYears.filter(apiYear => types.isUndefined(pnpYears.find(pnpYear => pnpYear == apiYear)));
            for (let apiYear of apiYears) {
                //Filtro os estudantes
                let yearEnrollments = null;
                let yearStudents = students.filter(student => student.ano_ingresso.toString() == apiYear);

                let coursesInfo = await this.coursesInfo(apiCourses, yearStudents, yearEnrollments);

                //Filtro os projetos
                let yearProjects = projects.filter(project => project.ano.toString() == apiYear);
                let projectsInfo = await this.projectsInfo(yearProjects);

                //Preencho com null as informações que dependem dos dados da PNP
                let rateCards = {
                    enrolledStudents: null,

                    apiIncomingStudents: yearStudents.length,
                    pnpIncomingStudents: null,

                    concludingStudents: {
                        concluded: null,
                        integralized: null
                    },
                    dropoutStudents: null
                }
                let entryMethods = await this.entryMethods(yearStudents);
                let slotReservationOptions = null;
                let studentsProfile = null;

                infoPerYear.push({
                    year: apiYear,
                    coursesInfo,
                    projectsInfo,
                    entryAndProgressInfo: {
                        rateCards,
                        entryMethods,
                        slotReservationOptions,
                    },
                    studentsProfile
                })
            }

            let response = {
                "units": units,
                "infoPerYear": infoPerYear
            };

            let keyName = `iffar-em-dados:campus:${StringService.urlFriendly(unitCity)}`;
            let baseTime = 2 * 24 * 60 * 60;
            await Redis.set(keyName, JSON.stringify(response))
            await Redis.expire(keyName, baseTime)

            return response;

        }
        console.log(util.inspect(theUnit));
    };

    //Retorna os dados necessários
    public async getCourse(courseId: number, ignoreCache = false) {
        if (!ignoreCache) {
            let responseCache = await Redis.get(`iffar-em-dados:course:${courseId}`);
            if (responseCache) {
                return responseCache;
            }
        }


        //Pego os dados do curso que é requisitado
        let cursosC = new CursosController();
        let course = await cursosC.get(courseId);
        //Pego as matrículas equivalente da PNP do curso sendo requisitado
        let pnpMatriculasC = new PnpMatriculasController();
        let enrollments = await pnpMatriculasC.getCourse(course);
        //E pego os dados de alunos da API dos dados abertos do IFFar (em determinadas partes necessito de ambos os dados)
        let alunosC = new AlunosController();
        let students = await alunosC.getStudentsFromCourse(course.id_curso);

        //Pego as informações sobre detalhamento. Algumas dessas informações até variam conforme os anos (por diferentes PPCs), mas os dados do IFFar não armazenam de forma temporal esses dados, então ele fica de fora do looping de anos
        let courseDetailing = await this.courseDetailing(course);
        console.log(util.inspect(courseDetailing));

        let levelOrDegree: string = '00000000000000000000000000000';

        if (courseDetailing.level == 'Técnico')
            levelOrDegree = StringService.portugueseTitleCase(courseDetailing.level);
        else
            levelOrDegree = StringService.portugueseTitleCase(courseDetailing.degree!);

        //Filtro o nome da API
        //Pego o nível do curso + "em" para remover e ter só o nome do
        let regex = new RegExp(`.*${levelOrDegree}(.*?) em `)
        let apiNameTitleCase = StringService.portugueseTitleCase(courseDetailing.apiName);
        courseDetailing.apiNameFiltered = apiNameTitleCase.replace(regex, '');

        //Crio um vetor contendo todos os anos existentes do curso nos dados da PNP. Também irei criar um com os anos disponíveis pelos dados da base Alunos, do IFFar  (https://stackoverflow.com/questions/15125920/how-to-get-distinct-values-from-an-array-of-objects-in-javascript)
        //A partir disso começo a montar o array final que será retornado contendo os dados em cada ano
        let infoPerYear: Array<any> = [];

        //Pego os anos que existem de dados da PNP
        let pnpYears = [...new Set(enrollments.map(enrollment => enrollment.anoBase))];

        for (let i = 0; i < pnpYears.length; i++) {
            //Filtro para se ter apenas as matrículas e dados sobre estudantes daquele específico ano. Contudo, existe uma limitação nos dados do IFFar: apenas consigo extrair a informação do ano de ingresso dos alunos, então as informações que utilizar esses dados apenas consegue representar a realidade dos estudantes que ingressaram aquele ano, diferentemente do PNP, que representa a realidade integral dos cursos.
            let yearEnrollments = enrollments.filter(enrollment => enrollment.anoBase == pnpYears[i]);
            let yearStudents = students.filter(student => student.ano_ingresso.toString() == pnpYears[i]);

            let rateCards = await this.rateCards(yearEnrollments, yearStudents);
            //console.log(util.inspect(rateCards));
            let entryMethods = await this.entryMethods(yearStudents);
            //console.log(util.inspect(entryMethods));
            let slotReservationOptions = await this.slotReservationOptions(yearEnrollments);
            //console.log(util.inspect(slotReservationOptions));
            let studentsProfile = await this.studentsProfile(yearEnrollments);
            //console.log(util.inspect(studentsProfile.racialDistribution, undefined, 4));

            infoPerYear.push({
                year: pnpYears[i],
                entryAndProgressInfo: {
                    rateCards,
                    entryMethods,
                    slotReservationOptions,
                },
                studentsProfile
            });
        }

        //Agora que realizei os processos que utilizam os dados da PNP, realizo o processo apenas para preencher as informações possíveis nos anos não cobertos pela PNP, utilizando os dados da base Alunos do IFFar
        //Porém, existem limitações críticas por utilizar apenas os dados da base Alunos. Por exemplo: se um curso ainda for ativo mas não estiver mais ofertando matrículas, e ainda não tiver sido publicado os dados da PNP que representem esse ano, não haverão informações para esse curso. Limitações nos dados que podem impedir uma correta oferta de informações

        //Primeiro crio o array apenas com anos em que houveram ingresso de estudantes, já que é a única forma de conseguir alguma informação de maneira temporal
        let apiYears = [...new Set(students.map(student => student.ano_ingresso.toString()))]
        //Removo os anos já cobertos no processamento dos dados da PNP
        apiYears = apiYears.filter(apiYear => types.isUndefined(pnpYears.find(pnpYear => pnpYear == apiYear)));

        for (let i = 0; i < apiYears.length; i++) {
            let yearStudents = students.filter(student => student.ano_ingresso.toString() == apiYears[i]);

            //Preencho com null as informações que dependem dos dados da PNP
            let rateCards = {
                enrolledStudents: null,

                apiIncomingStudents: yearStudents.length,
                pnpIncomingStudents: null,

                concludingStudents: {
                    concluded: null,
                    integralized: null
                },
                dropoutStudents: null
            }

            let entryMethods = await this.entryMethods(yearStudents);
            let slotReservationOptions = null;
            let studentsProfile = null;

            infoPerYear.push({
                year: apiYears[i],
                entryAndProgressInfo: {
                    rateCards,
                    entryMethods,
                    slotReservationOptions,
                },
                studentsProfile
            });
        }

        console.log(util.inspect(infoPerYear));

        //Pego a lista de disciplinas, já que os dados que o IFFar oferece não têm tanta utilidade (faltam os dados de em qual semestre são oferecidas para eu poder usar como informação), pego apenas a lista de nomes para a estilização gráfica no início da página
        let courseComponents = await this.courseComponents(course);

        console.log('Enviando resposta');
        let response = {
            courseDetailing,
            infoPerYear,
            courseComponents
        };

        let keyName = `iffar-em-dados:course:${courseId}`;
        let baseTime = 2 * 24 * 60 * 60;
        await Redis.set(keyName, JSON.stringify(response))
        await Redis.expire(keyName, baseTime)

        return response;

        // let unidadesC = new UnidadesOrganizacionaisController();
        // let unit = await unidadesC.get(41);
        // let projetosC = new ProjetosController();
        // //let projects = await projetosC.getFromUnit(unit);
        // let projects = await projetosC.getAll();
        // let projectsInfo = await this.projectsInfo(projects);

        // let gruposPesquisaC = new GruposPesquisasController();
        // let researchGroups = await gruposPesquisaC.getAll();
        // let researchGroupsInfo = await this.researchGroupsInfo(researchGroups);
    };

    //####
    //Funções utilizadas em todas
    //####
    //Função pra transformar uma unidade em Unit
    private async unidadeOrganizacionalToUnit(unidade: UnidadeOrganizacional, getLocation = false): Promise<Unit> {
        let unit = new Unit();
        unit.apiId = unidade.id_unidade;
        unit.name = unidade.nome;
        unit.type = unidade.type;

        unit.city = {
            cityId: unidade.city.id_municipio,
            cityName: unidade.city.nome
        };

        unit.state = {
            stateId: unidade.city.state.id_unidade_federativa,
            stateName: unidade.city.state.descricao,
            stateInitials: unidade.city.state.sigla
        };

        if (getLocation) {
            let locationC = new LocationsController();
            let location = await locationC.get(unit);
            unit.location = locationC.locationToUnit(location);
        }

        return unit;
    }

    //Função para pegar todas as unidades para Unit
    private async mountUnits(unidades: Array<UnidadeOrganizacional>, getLocation = false) {
        let units: Array<Unit> = [];

        for (let unidade of unidades) {
            let unit = await this.unidadeOrganizacionalToUnit(unidade, getLocation)
            units.push(unit);
        }

        return units;
    }
    private async getMap() {
        let unit = new Unit();
        unit.state = {
            stateId: 43,
            stateName: 'Rio Grande do Sul',
            stateInitials: 'RS'
        }
        let locationC = new LocationsController();
        let location = await locationC.get(unit);

        return locationC.locationToUnit(location);
    }

    //####
    //Funções utilizadas ao menos na página específica de curso
    //####

    private async courseDetailing(course: Curso, year?: number) {
        class CourseDetailing {
            apiId: number;
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
            apiName: string;
            apiNameFiltered: string;
            pnpName: string | null;
        }
        let detailing = new CourseDetailing();
        detailing.apiId = course.id_curso;

        /**Definindo:
         * Nível do curso
         * Grau do curso (para cursos técnicos e de pós graduação será chamado de categoria para o usuário)
         */
        switch (course.nivel) {
            case 'M':
            case 'N':
                detailing.level = 'Técnico';
                //Testo se tem PROEJA no nome, para diferençar o integrado PROEJA do integrado ao ensino médio
                if (/proeja/.test(course.nome.toLowerCase()))
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
        if (types.isNumber(course.id_tipo_oferta_curso)) {
            let tiposOfertaC = new TiposOfertaCursoController();
            let offerType = await tiposOfertaC.get(course.id_tipo_oferta_curso);
            detailing.offerType = offerType.descricao;
        } else {
            detailing.offerType = null;
        }

        // Área do conhecimento e Eixo de conhecimento (técnico)
        if (!types.isNull(course.id_area_curso)) {
            let areasCnpqC = new AreasCursoCnpqController();
            let area = await areasCnpqC.get(course.id_area_curso);
            detailing.knowledgeArea = area.nome;
        } else {
            detailing.knowledgeArea = null;
        }

        if (!types.isNull(course.id_eixo_conhecimento)) {
            let eixosC = new EixosConhecimentoController();
            let knowledgeAxis = await eixosC.get(course.id_eixo_conhecimento);
            detailing.knowledgeAxis = knowledgeAxis.nome;
        } else {
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

        detailing.apiName = course.nome;
        detailing.pnpName = pnpCourseInfo[0].nomeDeCurso;

        return detailing;
    }

    private async rateCards(enrollments: Array<PnpMatricula>, students: Array<Aluno>) {
        class RateCards {
            enrolledStudents: number;

            apiIncomingStudents: number;
            pnpIncomingStudents: number;

            concludingStudents: {
                concluded: number,
                integralized: number
            };
            dropoutStudents: any
        }
        let cards = new RateCards();

        //Pego o total de alunos matriculados
        cards.enrolledStudents = enrollments.length;

        //Pego o total de alunos ingressantes informado pelos dados da API do IFFar
        cards.apiIncomingStudents = students.length;
        //Pego o total de alunos ingressantes informado pelos dados da PNP
        cards.pnpIncomingStudents = enrollments.reduce(function (total, enrollment) {
            //Pego a data e divido em três partes, para selecionar o ano
            let [day, month, year] = enrollment.dataDeInicioDoCiclo.split('/');
            //Verifico se o ano base da PNP é o mesmo que o ano do início da matrícula. Se for, adiciono mais 1 no total
            return (enrollment.anoBase == year) ? ++total : total;
        }, 0);

        cards.concludingStudents = {
            //Pego o total de alunos que concluíram o curso
            concluded: enrollments.reduce(function (total, enrollment) {
                return enrollment.situacaoDeMatricula == 'Concluída' ? ++total : total;
            }, 0),
            //Pego o total de alunos que estão com a matrícula do curso integralizada (falta apenas TCC, estágio, etc.)
            integralized: enrollments.reduce(function (total, enrollment) {
                return enrollment.situacaoDeMatricula == 'Integralizada' ? ++total : total;
            }, 0)
        };

        //Pego o total de estudantes evadidos
        cards.dropoutStudents = {
            //Matrículas desligadas
            discontinued: enrollments.reduce(function (total, enrollment) {
                return enrollment.situacaoDeMatricula == 'Desligada' ? ++total : total;
            }, 0),
            //Matrículas canceladas
            cancelled: enrollments.reduce(function (total, enrollment) {
                return enrollment.situacaoDeMatricula == 'Cancelada' ? ++total : total;
            }, 0),
            //Matrículas abandonadas
            abandoned: enrollments.reduce(function (total, enrollment) {
                return enrollment.situacaoDeMatricula == 'Abandono' ? ++total : total;
            }, 0),
            //Matrículas reprovadas (o aluno que está impossibilitado de continuar no curso e reprovou em alguma coisa)
            reproved: enrollments.reduce(function (total, enrollment) {
                return enrollment.situacaoDeMatricula == 'Reprovado' ? ++total : total;
            }, 0),
            //Estudantes que realizaram transferência externa
            externalTransfer: enrollments.reduce(function (total, enrollment) {
                return enrollment.situacaoDeMatricula == 'Transf. externa' ? ++total : total;
            }, 0),
            //Estudantes que realizaram transferência interna
            internalTransfer: enrollments.reduce(function (total, enrollment) {
                return enrollment.situacaoDeMatricula == 'Transf. interna' ? ++total : total;
            }, 0)
        };

        return cards;
    }

    private async entryMethods(students: Array<Aluno>) {
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
            if (types.isUndefined(entryMethods.find(entryMethod => entryMethod.entryMethodId == student.id_forma_ingresso))) {
                //Pego os dados da forma de ingresso que será adicionada no array de contagem
                let entryMethodData = entryMethodsList.find(entryMethod => entryMethod.id_forma_ingresso == student.id_forma_ingresso);

                let entryMethod = {
                    entryMethodId: entryMethodData?.id_forma_ingresso,
                    entryMethodDescription: entryMethodData?.descricao,
                    total: 1 //O aluno atual que está sendo contabilizado
                }
                entryMethods.push(entryMethod)
            } else {
                //Pego o índice da forma de ingresso no vetor de contagem
                let entryMethodIndex = entryMethods.findIndex(entryMethod => entryMethod.entryMethodId == student.id_forma_ingresso);
                //Adiciono mais 1 no total
                entryMethods[entryMethodIndex].total++;
            }
        });

        return entryMethods;
    }

    private async slotReservationOptions(enrollments: Array<PnpMatricula>) {
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

    private async studentsProfile(enrollments: Array<PnpMatricula>) {
        //Semelhante aos painéis da PNP apresentados, os conjuntos de dados sobre o perfil dos estudantes serão um tanto relacionados entre si. No caso, a estrutura de dados seguirá de uma forma em que dados sobre renda familiar serão relacionados com dados sobre cor de pele/raça, assim como dados sobre distribuição por gênero possuirão ligação com os dados sobre faixa etária
        //Por exemplo, cada valor de idade será interseccionado entre as alternativas de gênero contidas na PNP. Já as alternativas de cor de pele/raça, de forma semelhante, conterão a intersecção para cada tipo de renda per capita familiar. Isso é necessário para permitir maiores inferências no futuro, porém, sem tornar o conjunto de dados muito grande ou complexo de se trabalhar no lado do usuário.
        //A título de comparação, se eu utilizasse os dados com um menor nível de granularidade, realizando as combinações de Cor, Renda, Idade e Gênero, haveriam 1496 registros diferentes para realizar a contagem considerando todas essas intersecções, enquanto que limitar a intersecção entre Cor e Renda (40 combinações) e Idade e Gênero (134 combinações) tornam os dados muito menores
        //Pouco tempo, irmão, vai a faixa etária mesmo pra poupar trabalho kkkkkkkkkk
        //No futuro eu ajeito essa budega

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
            if (types.isUndefined(ageGroupsDistribution.find(ageGroup => ageGroup.age == student.faixaEtaria))) {
                //Se a idade não existe no vetor, a distribuição por gênero também não existe, então posso adicionar esses valor diretamente sem verificações
                ageGroupsDistribution.push({
                    age: student.faixaEtaria,
                    genderDistribution: [{
                        description: student.sexo,
                        total: 1
                    }]
                })
            } else {
                //Agora, se a idade já está cadastrada, preciso fazer as verificações para o gênero

                //Pego o índice da idade no vetor
                let ageIndex = ageGroupsDistribution.findIndex(ageGroup => ageGroup.age == student.faixaEtaria);

                //Com o índice em mãos, faço a procura pelo gênero
                if (types.isUndefined(ageGroupsDistribution[ageIndex].genderDistribution.find(gender => gender.description == student.sexo))) {
                    ageGroupsDistribution[ageIndex].genderDistribution.push({
                        description: student.sexo,
                        total: 1
                    })
                } else {
                    //Se o gênero já estiver registrado, apenas adiciono +1 no total
                    let genderIndex = ageGroupsDistribution[ageIndex].genderDistribution.findIndex(gender => gender.description == student.sexo);
                    ageGroupsDistribution[ageIndex].genderDistribution[genderIndex].total++;
                }
            }

            //Agora, as verificações para registro de dados sobre cor/raça e renda familiar. Segue a mesma lógica da verificação anterior
            if (types.isUndefined(racialDistribution.find(racialGroup => racialGroup.description == student.corRaca))) {
                racialDistribution.push({
                    description: student.corRaca,
                    income: [{
                        description: student.rendaFamiliar,
                        total: 1
                    }]
                })
            } else {
                let raceGroupIndex = racialDistribution.findIndex(racialGroup => racialGroup.description == student.corRaca);

                if (types.isUndefined(racialDistribution[raceGroupIndex].income.find(income => income.description == student.rendaFamiliar))) {
                    racialDistribution[raceGroupIndex].income.push({
                        description: student.rendaFamiliar,
                        total: 1
                    })
                } else {
                    let incomeIndex = racialDistribution[raceGroupIndex].income.findIndex(income => income.description == student.rendaFamiliar);
                    racialDistribution[raceGroupIndex].income[incomeIndex].total++;
                }
            }
        });

        return { ageGroupsDistribution, racialDistribution };

    }

    private async courseComponents(course: Curso) {
        //Pego a lista de disciplinas do curso
        // let componentesC = new ComponentesCurricularesController();
        // let curricularComponents = await componentesC.getCourse(course.id_curso);

        // //Crio a lista com apenas os nomes das disciplinas, utilizando o portugueseTitleCase para deixar normal os títulos
        // return curricularComponents.map(component => StringService.portugueseTitleCase(component.nome));
        let detailing = await this.courseDetailing(course);
        let ultimoRecurso: Array<string> = [detailing.city!, detailing.degree!, detailing.level!];
        if (!types.isNull(detailing.modality))
            ultimoRecurso.push(detailing.modality);
        if (!types.isNull(detailing.offerType))
            ultimoRecurso.push(detailing.offerType);
        if (types.isNull(detailing.knowledgeAxis))
            ultimoRecurso.push(detailing.knowledgeArea!);
        else
            ultimoRecurso.push(detailing.knowledgeAxis!);
        console.log(util.inspect(ultimoRecurso));
        ultimoRecurso = ultimoRecurso.map(item => StringService.portugueseTitleCase(item));
        return ultimoRecurso;
    }


    //####
    //Funções utilizadas na página de campus
    //####

    //Uma função "auxiliar". Serve para deixar o código mais organizado, distribuindo partes de código em diferentes funções para facilitar a navegação
    //Aqui realizo um processo de filtragem de cursos para depois chamar a função que realmente vai processar e retornar os dados
    private async coursesInfo(courses: Array<Curso>, students: Array<Aluno>, enrollments: Array<PnpMatricula> | null = null) {
        //Uma característica importante: será utilizada a característica de mostrar os cursos ofertados em determinado ano apenas os cursos que possuem alunos ingressantes. Assim, um curso técnico que não está mais ativo (não criando novas turmas, por exemplo) será apresentado nos anos que ainda haviam alunos ingressando

        //A variável que será retornada com todos os dados
        let coursesInfo: Array<any> = [];

        //Crio uma lista de estudantes ingressantes do ano a ser verificado (dados do IFFar)
        //let incomingStudents = students.filter(student => student.ano_ingresso == Number(year)); //(os dados já vêm filtrados para o ano)
        //Agora crio a lista de cursos que tinham alunos ingressando nesse ano
        let coursesIdWithIncoming = [...new Set(students.map(student => student.id_curso))];
        console.log(util.inspect(coursesIdWithIncoming));

        //Percorro a lista de cursos que possuem alunos ingressantes
        for (let courseId of coursesIdWithIncoming) {
            //Pego os dados do curso, para extrair-se os dados
            let course = courses.find(course => course.id_curso == courseId);

            //Filtro a lista de estudantes deste curso
            let courseStudents = students.filter(student => student.id_curso == courseId);

            //Pego o conjunto de informações necessárias para se filtrar as matrículas da PNP
            let courseEnrollments: Array<PnpMatricula> | null = null;
            if (!types.isUndefined(course) && !types.isNull(enrollments)) {
                /**No caso do IFFar, para filtrar-se um curso da PNP são necesssários pelo menos 5 atributos:
                 * nomeMunicipio
                 * tipoDeCurso
                 * tipoDeOferta
                 * modalidadeDeEnsino
                 * nomeDeCurso
                 */

                const unidadesC = new UnidadesOrganizacionaisController();
                let courseUnit = await unidadesC.getUnitFromCourse(course);

                let pnpC = new PnpMatriculasController();
                let nomeMunicipio = courseUnit.city.nome;
                let { tipoDeCurso, tipoDeOferta } = pnpC.getPnpTypes(course);
                let modalidadeDeEnsino = pnpC.getPnpModality(course);

                //Pego a lista de cursos que possuem características iguais, para poder pegar o nome do curso
                let pnpCourses = await PnpMatricula
                    .query()
                    .where('nomeMunicipio', nomeMunicipio)
                    .where('modalidadeDeEnsino', modalidadeDeEnsino)
                    .where('tipoDeCurso', tipoDeCurso)
                    .where('tipoDeOferta', tipoDeOferta)
                    .groupBy('nomeDeCurso');
                console.log('nomeMunicipio: %s', util.inspect(nomeMunicipio));
                console.log('modalidadeDeEnsino: %s', util.inspect(modalidadeDeEnsino));
                console.log('tipoDeCurso: %s', util.inspect(tipoDeCurso));
                console.log('tipoDeOferta: %s\n', util.inspect(tipoDeOferta));
                // console.log(util.inspect(course));
                let nomeDeCurso = pnpC.getPnpCourseName(course, pnpCourses);

                //Filtro a lista de matrículas da PNP deste curso conforme os atributos
                courseEnrollments = enrollments?.filter(enroll =>
                    enroll.nomeMunicipio == nomeMunicipio &&
                    enroll.tipoDeCurso == tipoDeCurso &&
                    enroll.tipoDeOferta == tipoDeOferta &&
                    enroll.modalidadeDeEnsino == modalidadeDeEnsino &&
                    enroll.nomeDeCurso == nomeDeCurso
                );
            }

            //Agora executo a função para processar os dados dos cursos
            if (!types.isUndefined(course)) {
                let courseInfo = await this.courseInfo(course, courseStudents, courseEnrollments);
                coursesInfo.push(courseInfo);
            }
        }

        return coursesInfo;
    }


    private async courseInfo(course: Curso, students: Array<Aluno>, enrollments: Array<PnpMatricula> | null = null) {
        // Informações procuradas:
        //     Nome do curso
        //     Nível (técnico, graduação, pós, FIC)
        //     Grau (tipo de técnico, tipo de graduação, etc.)
        //     Modalidade (presencial ou à distâncial)
        //     Turno de oferta
        //     Área do conhecimento/eixo
        //     Onde é ofertado

        //     Vagas ofertadas
        //     Alunos matriculados
        //     Alunos ingressantes

        class CourseInfo {
            apiName: string; //Nome do curso
            apiNameFiltered: string;
            level: string; //Nível
            degree: string; //Grau
            modality: string; //Modalidade;
            knowledgeArea; //Área do conhecimento/eixo

            //Utilizado para formar a url
            apiId: number;
            // unitId: number; //Onde é ofertado
            cityName: string; //Onde é ofertado

            //Dependente do PNP
            pnpName: string | null; //(PNP)
            turn: string | null; //Turno de oferta //(PNP)
            courseSlots: number | null; //Vagas ofertadas //(PNP)
            enrolledStudents: number | null; //Alunos matriculados //(PNP)
            incomingStudents: number //Alunos ingressantes //(PNP ou não)
        }

        let courseInfo = new CourseInfo();

        //Atributo de nome do curso dado pela API
        courseInfo.apiName = course.nome;
        let levelOrDegree: string = '00000000000000000000000000000';

        //Atributos de nível e grau de curso
        switch (course.nivel) {
            case 'M':
            case 'N':
                courseInfo.level = 'Técnico';
                levelOrDegree = StringService.portugueseTitleCase(courseInfo.level);
                //Testo se tem PROEJA no nome, para diferençar o integrado PROEJA do integrado ao ensino médio
                if (/proeja/.test(course.nome.toLowerCase()))
                    courseInfo.degree = 'PROEJA';
                else
                    courseInfo.degree = 'Integrado';
                break;
            case 'T':
                courseInfo.level = 'Técnico';
                levelOrDegree = StringService.portugueseTitleCase(courseInfo.level);
                courseInfo.degree = 'Subsequente';
                break;
            case 'L':
                courseInfo.level = 'Pós-graduação';
                courseInfo.degree = 'Lato Sensu';
                break;
            case 'E':
                courseInfo.level = 'Pós-graduação';
                courseInfo.degree = 'Stricto Sensu';
                break;
            case 'G':
                courseInfo.level = 'Graduação';
                //Para a graduação, verifico o grau acadêmico:
                /** 
                    * id_grau_academico -	descricao
                    * 8067070 -            LICENCIATURA;
                    * 2 -	                PROGRAMAS ESPECIAIS DE FORMAÇÃO PEDAGÓGICA;
                    * 1 -	                BACHARELADO;
                    * 4 -	                TECNOLOGIA;
                    */
                switch (course.id_grau_academico) {
                    case 2: //A PNP considera como licenciatura o único curso desse tipo (e o título do grau nos dados do IFFar indicam o mesmo)
                    case 8067070:
                        courseInfo.degree = 'Licenciatura';
                        break;
                    case 1:
                        courseInfo.degree = 'Bacharelado';
                        break;
                    case 4:
                        courseInfo.degree = 'Tecnologia';
                        break;
                    default: //TENHO QUE DEFINIR O DEFAULT
                        courseInfo.degree = 'Não identificado';
                }
                levelOrDegree = StringService.portugueseTitleCase(courseInfo.degree);
                break;
            default: //TENHO QUE DEFINIR O DEFAULT
                courseInfo.level = 'Não identificado';
                courseInfo.degree = 'Não identificado';
                levelOrDegree = StringService.portugueseTitleCase(courseInfo.degree);
        }

        //Filtro o nome da API
        //Pego o nível do curso + "em" para remover e ter só o nome do
        let regex = new RegExp(`.*${levelOrDegree}(.*?) em `)
        let apiNameTitleCase = StringService.portugueseTitleCase(courseInfo.apiName);
        courseInfo.apiNameFiltered = apiNameTitleCase.replace(regex, '');

        //Atributo de modalidade
        switch (course.id_modalidade_educacao) {
            case 1:
                courseInfo.modality = 'Presencial';
                break;
            case 2:
                courseInfo.modality = 'A Distância';
                break;
            case 3:
                courseInfo.modality = 'Semi-Presencial';
                break;
            case 4:
                courseInfo.modality = 'Remoto';
                break;
            default:
                courseInfo.modality = 'Não identificada';
        }

        //Atributo da área do conhecimento
        switch (course.nivel) {
            case 'M':
            case 'N':
            case 'T':
                if (!types.isNull(course.id_eixo_conhecimento) && !types.isUndefined(course.id_eixo_conhecimento) && !string.isEmpty(course.id_eixo_conhecimento + '')) {
                    console.log(util.inspect(course.id_eixo_conhecimento))
                    let eixosC = new EixosConhecimentoController();
                    let axis = await eixosC.get(course.id_eixo_conhecimento);
                    courseInfo.knowledgeArea = axis.nome;
                } else
                    courseInfo.knowledgeArea = 'Não definido';

                break;
            case 'L':
            case 'E':
            case 'G':
                if (!types.isNull(course.id_area_curso) && !types.isUndefined(course.id_area_curso) && !string.isEmpty(course.id_area_curso + '')) {
                    let areasC = new AreasCursoCnpqController();
                    let knowledgeArea = await areasC.get(course.id_area_curso);
                    courseInfo.knowledgeArea = knowledgeArea.nome;
                } else
                    courseInfo.knowledgeArea = 'Não definido';

                break;
            default:
                courseInfo.knowledgeArea = 'Não definido';
        }


        let unidadesC = new UnidadesOrganizacionaisController();
        let unit = await unidadesC.get(course.id_unidade);
        let municipiosC = new MunicipiosController();
        let city = await municipiosC.get(unit.id_municipio);
        //Atributos de identificação para url (nome da cidade e id da API)
        courseInfo.cityName = city.nome;
        courseInfo.apiId = course.id_curso;

        //Agora preencho os atributos dependentes do PNP
        if (!types.isNull(enrollments) && !types.isUndefined(enrollments) && enrollments.length > 0) {
            //Pego o nome do curso dado pelo PNP
            console.log(util.inspect(enrollments[0]))
            courseInfo.pnpName = enrollments[0].nomeDeCurso;
            //Pego o total de alunos matriculados
            courseInfo.enrolledStudents = enrollments.length;

            //Agora pego todas as matrículas ingressantes para poder pegar os dados daquele ano sobre alunos ingressantes e dados de vagas ofertadas
            let incomingEnrollments = enrollments.filter(enrollment => {
                //Pego a data e divido em três partes, para selecionar o ano
                let [day, month, year] = enrollment.dataDeInicioDoCiclo.split('/');
                //Verifico se o ano base da PNP é o mesmo que o ano do início da matrícula. Se for, adiciono mais 1 no total
                return (enrollment.anoBase == year) ? true : false;
            });
            //Total de alunos ingressantes
            courseInfo.incomingStudents = incomingEnrollments.length;
            //Pego os dados do primeiro registro de aluno ingressante por causa que é para pegar a informação do curso mais atual, como do PPC mais atual
            //ALERTA: FAZER A BUSCA PARA VERIFICAR SE EXISTE MAIS DE UM TURNO DO MESMO CURSO. SE TIVER, CRIAR UM OBJETO ADICIONAL. PRECISO ANALISAR QUAL A MELHOR ABORDAGEM PARA ISSO, VISTO QUE OS DADOS DO IFFAR NÃO POSSUEM RELAÇÃO DE TURNO, JÁ QUE SÓ AFETA O GRÁFICO DE TURNO DE OFERTA (posso retornar um array, e aí dou um concat ou spread (...) ao invés de push; ou então os dados de turno viram um array)
            console.log(util.inspect(incomingEnrollments[0]))
            if (incomingEnrollments.length > 0) {
                courseInfo.turn = incomingEnrollments[0].turno;
                courseInfo.courseSlots = Number(incomingEnrollments[0].vagasOfertadas);
            } else {
                courseInfo.turn = null;
                courseInfo.courseSlots = null;
            }
        } else {
            courseInfo.pnpName = null;
            courseInfo.turn = null;
            courseInfo.courseSlots = null;
            courseInfo.enrolledStudents = null;

            //Se não tiver os dados do PNP insiro apenas os dados de alunos ingressantes dado pela API
            courseInfo.incomingStudents = students.length;
        }

        return courseInfo;
    }

    //Retornar uma lista do total de projetos existentes por cada área do conhecimento
    private async projectsInfo(projects: Array<Projeto>) {
        let knowledgeAreasProjects: Array<{
            apiId: number,
            description: string, //O nome da área do conhecimento
            projects: Array<{ //A lista de tipos de projetos com os dados do número de projetos
                apiId: number, //O id do tipo de projeto (economiza umas linhas de código)
                type: string, //Tipo de projeto (ensino, pesquisa ou extensão)
                // members: Array<number>, //O total de membros envolvidos por projeto. P.S.: members.lenth indica a quantia de projetos existentes
                total: number
            }>
        }> = [];

        let areasCnpqC = new AreasCursoCnpqController();
        let knowledgeAreas = await areasCnpqC.getAll();

        let tiposProjetosC = new TiposProjetosController();
        let projectTypes = await tiposProjetosC.getAll();

        let membrosProjetosC = new MembrosProjetosController();
        let projectsMembers = await membrosProjetosC.getAll();


        projects.forEach(project => {
            //A área do conhecimento em alguns projetos não são definidas, então verifico e crio um valor para indicar isso
            let ka: any;
            //Tenho que verificar se não é apenas uma string vazia também, por causa que tem projeto com o campo vazio, aí nunca dá para saber se é undefined, null ou uma string vazia ('')
            if (types.isUndefined(project.id_area_conhecimento_cnpq) || types.isNull(project.id_area_conhecimento_cnpq) || string.isEmpty(project.id_area_conhecimento_cnpq + ''))
                ka = { id_area_conhecimento_cnpq: -1, nome: 'Área não definida' };
            else
                ka = knowledgeAreas.find(ka => ka.id_area_conhecimento_cnpq == project.id_area_conhecimento_cnpq);

            let projectType: any;
            if (types.isNull(project.id_tipo_projeto) || types.isUndefined(project.id_tipo_projeto) || string.isEmpty(project.id_tipo_projeto + ''))
                projectType = { id_tipo_projeto: -1, descricao: 'Tipo não definido' }
            else
                projectType = projectTypes.find(pt => pt.id_tipo_projeto == project.id_tipo_projeto);

            // let projectMembers = projectsMembers.filter(projectMember => projectMember.id_projeto == project.id_projeto);

            //Mesma lógica para os métodos anteriores. Verifico se existe no array a área do conhecimento do projeto atual, se não, adiciono. Se tiver, verifico os tipos de projetos existentes, aí adiciono se não tiver o tipo no vetor da área e aí adiciono à contagem +1
            if (types.isUndefined(knowledgeAreasProjects.find(kap => kap.apiId == ka.id_area_conhecimento_cnpq))) {
                knowledgeAreasProjects.push({
                    apiId: ka.id_area_conhecimento_cnpq,
                    description: ka.nome,
                    projects: [{
                        apiId: projectType.id_tipo_projeto,
                        type: projectType.descricao,
                        // members: [projectMembers.length], //O comprimento do vetor indica a quantia de membros no projeto
                        total: 1,
                    }]
                })
            } else {
                let kapIndex = knowledgeAreasProjects.findIndex(kap => kap.apiId == ka.id_area_conhecimento_cnpq);
                if (types.isUndefined(knowledgeAreasProjects[kapIndex].projects.find(pt => pt.apiId == projectType?.id_tipo_projeto))) {
                    knowledgeAreasProjects[kapIndex].projects.push({
                        apiId: projectType.id_tipo_projeto,
                        type: projectType.descricao,
                        // members: [projectMembers.length],
                        total: 1,
                    })
                } else {
                    let projectTypeIndex = knowledgeAreasProjects[kapIndex].projects.findIndex(pt => pt.apiId == projectType?.id_tipo_projeto);
                    // knowledgeAreasProjects[kapIndex].projects[projectTypeIndex].members.push(projectMembers.length); //Adiciono o número de membros por projeto
                    knowledgeAreasProjects[kapIndex].projects[projectTypeIndex].total++;
                }
            }
        })
        console.log("#########################################")
        console.log(util.inspect(knowledgeAreasProjects, false, 4));
        console.log("#########################################\n\n")
        return knowledgeAreasProjects;
    }

    //####
    //Funções utilizadas na página inicial
    //####

    private async researchGroupsInfo(researchGroups: Array<GrupoPesquisa>) {
        let researchGroupsInfo: Array<{
            apiId: number,
            name: string, //O nome do grupo de pesquisa
            knowledgeArea: {
                apiId: number,
                description: string
            },
            members: number, //O total de membros envolvidos no grupo
            researchLines: number //O total de linhas de pesquisas relacionadas ao grupo
        }> = [];

        let areasCnpqC = new AreasCursoCnpqController();
        let knowledgeAreas = await areasCnpqC.getAll();

        //Informações do total de membros nos grupos
        let gruposPesquisaC = new MembrosGruposPesquisaController();
        let researchGroupsMembers = await gruposPesquisaC.getAll();

        let linhasGruposPesquisaC = new LinhasGruposPesquisaController();
        let researchLines = await linhasGruposPesquisaC.getAll();

        researchGroups.forEach(researchGroup => {
            //Informações da área do conhecimento do grupo
            let ka: any;
            if (types.isUndefined(researchGroup.id_area_conhecimento_cnpq) || types.isNull(researchGroup.id_area_conhecimento_cnpq) || string.isEmpty(researchGroup.id_area_conhecimento_cnpq + ''))
                ka = { id_area_conhecimento_cnpq: -1, nome: 'Área não definida' };
            else
                ka = knowledgeAreas.find(ka => ka.id_area_conhecimento_cnpq == researchGroup.id_area_conhecimento_cnpq);

            //Filtrar os membros apenas do grupo de pesquisa
            let reGroupMembers = researchGroupsMembers.filter(reGroupMembers => reGroupMembers.id_grupo_pesquisa == researchGroup.id_grupo_pesquisa);

            //Informações do total de linhas de pesquisa no grupo
            let reLines = researchLines.filter(reLine => reLine.id_grupo_pesquisa == researchGroup.id_grupo_pesquisa)

            researchGroupsInfo.push({
                apiId: researchGroup.id_grupo_pesquisa,
                name: researchGroup.nome,
                knowledgeArea: {
                    apiId: ka.id_area_conhecimento_cnpq,
                    description: ka.nome
                },
                members: reGroupMembers.length,
                researchLines: reLines.length
            });
        })

        return researchGroupsInfo;
    }

}
