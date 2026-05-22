import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, ProcessType, UserRole } from '@prisma/client';
const prisma = new PrismaClient();
const flowTemplates = [
    {
        name: 'Fluxo de Abertura de Empresa',
        type: ProcessType.ABERTURA_EMPRESA,
        steps: [
            'Conversa Inicial',
            'Analise de Nome Empresarial',
            'Definicao de CNAE',
            'Definicao de Regime Tributario',
            'Viabilidade Junta Comercial',
            'DBE',
            'Contrato Social',
            'Envio para Assinatura',
            'Registro Junta Comercial',
            'Prefeitura',
            'Estado',
            'Orgao Regulador',
            'Opcao pelo Simples Nacional',
            'Finalizacao',
        ],
    },
    {
        name: 'Fluxo de Alteracao de Empresa',
        type: ProcessType.ALTERACAO_EMPRESA,
        steps: [
            'Solicitacao do Cliente',
            'Analise da Alteracao',
            'Viabilidade Junta Comercial',
            'DBE',
            'Emissao de Documentos',
            'Envio para Assinatura',
            'Registro Junta Comercial',
            'Prefeitura',
            'Estado',
            'Orgao Regulador',
            'Atualizacao de Cadastros',
            'Finalizacao',
        ],
    },
    {
        name: 'Fluxo de Encerramento de Empresa',
        type: ProcessType.ENCERRAMENTO_EMPRESA,
        steps: [
            'Solicitacao de Encerramento pelo Cliente',
            'Analise da Situacao da Empresa',
            'Levantamento de Pendencias Fiscais e Tributarias',
            'Regularizacao de Pendencias',
            'Emissao de Certidoes Necessarias',
            'Elaboracao do Distrato Social/Requerimento',
            'Viabilidade Junta Comercial',
            'DBE de Baixa',
            'Emissao de Documentos',
            'Envio para Assinatura',
            'Registro na Junta Comercial',
            'Baixa Receita Federal',
            'Baixa Estadual',
            'Baixa Municipal',
            'Baixa em Orgao Regulador',
            'Cancelamento de Inscricoes e Licencas',
            'Conferencia Final',
            'Finalizacao do Processo',
        ],
    },
];
async function main() {
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@contabil.local' },
        update: {},
        create: {
            name: 'Administrador',
            email: 'admin@contabil.local',
            passwordHash: adminPassword,
            role: UserRole.ADMIN,
            active: true,
        },
    });
    for (const template of flowTemplates) {
        const existing = await prisma.processFlowTemplate.findFirst({
            where: { type: template.type, isDefault: true },
        });
        if (existing) {
            continue;
        }
        await prisma.processFlowTemplate.create({
            data: {
                name: template.name,
                type: template.type,
                isDefault: true,
                steps: {
                    create: template.steps.map((title, index) => ({
                        title,
                        orderIndex: index + 1,
                    })),
                },
            },
        });
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error('Seed error', error);
    await prisma.$disconnect();
    process.exit(1);
});
