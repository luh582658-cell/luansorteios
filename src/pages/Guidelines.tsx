import { useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, Scale, Trophy } from 'lucide-react';

export default function Guidelines() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <Scale className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 text-white tracking-tighter uppercase">
          Termos e <span className="text-primary">Condições</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base font-medium">
          Leia atentamente as regras e diretrizes para participar de nossos sorteios. A transparência e a segurança são os nossos maiores compromissos com você.
        </p>
      </div>

      <div className="glass-card p-8 md:p-12 space-y-10 border-white/5 shadow-2xl">
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary mb-6">
            <Shield className="w-8 h-8" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">1. Aceitação dos Termos</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            Ao acessar e utilizar a plataforma <strong>Luan Sorteios</strong>, você concorda expressamente com todos os termos e condições aqui descritos. Caso não concorde com qualquer parte destes termos, solicitamos que não utilize nossos serviços. A participação em nossos sorteios implica na aceitação total e irrestrita destas regras.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary mb-6">
            <CheckCircle className="w-8 h-8" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">2. Elegibilidade e Participação</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            A participação em nossos sorteios é estritamente restrita a pessoas físicas, maiores de 18 (dezoito) anos, residentes e domiciliadas em território nacional, que possuam CPF válido e regular junto à Receita Federal do Brasil.
          </p>
          <ul className="space-y-3 mt-4 text-gray-300 text-sm md:text-base">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>É terminantemente proibida a participação de menores de idade, mesmo com autorização dos responsáveis.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>O usuário é o único responsável pela veracidade das informações fornecidas no momento do cadastro.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary mb-6">
            <AlertTriangle className="w-8 h-8" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">3. Regras de Pagamento e Cotas</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            Para garantir a lisura do processo, estabelecemos regras estritas quanto à aquisição e pagamento das cotas:
          </p>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 mt-4 space-y-4">
            <p className="text-gray-300 text-sm md:text-base">
              <strong>Tempo de Reserva:</strong> Ao selecionar seus números, você terá um prazo estipulado (geralmente 15 minutos) para efetuar o pagamento via PIX. Caso o pagamento não seja confirmado neste prazo, os números retornarão automaticamente para a venda.
            </p>
            <p className="text-gray-300 text-sm md:text-base">
              <strong>Comprovantes:</strong> O sistema processa os pagamentos via Mercado Pago automaticamente. Não é necessário enviar comprovantes, a menos que solicitado pelo suporte em casos excepcionais.
            </p>
            <p className="text-gray-300 text-sm md:text-base">
              <strong>Reembolsos:</strong> Por se tratar de cotas de sorteio, não realizamos reembolsos ou cancelamentos após a confirmação do pagamento e geração dos números da sorte, garantindo a integridade do prêmio para todos os participantes.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary mb-6">
            <Trophy className="w-8 h-8" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">4. Sorteio e Entrega de Prêmios</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            Nossos sorteios são baseados nos resultados da Loteria Federal, garantindo 100% de transparência e impossibilidade de manipulação. O ganhador será o participante cujo número da sorte coincidir com a extração da Loteria Federal conforme as regras específicas de cada campanha.
          </p>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base mt-4">
            O prêmio será entregue ao titular do cadastro vencedor. A organização entrará em contato através dos dados fornecidos (telefone/e-mail). Caso o ganhador não seja localizado no prazo de 30 dias, o prêmio poderá ser destinado a instituições de caridade ou sorteado novamente, a critério da organização.
          </p>
        </section>
      </div>
    </div>
  );
}
