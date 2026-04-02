import { useEffect } from 'react';
import { Shield, Lock, Eye, Database } from 'lucide-react';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 text-white tracking-tighter uppercase">
          Política de <span className="text-primary">Privacidade</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base font-medium">
          A sua privacidade é a nossa prioridade. Entenda como protegemos seus dados e garantimos uma experiência segura na nossa plataforma.
        </p>
      </div>

      <div className="glass-card p-8 md:p-12 space-y-10 border-white/5 shadow-2xl">
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary mb-6">
            <Database className="w-8 h-8" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">1. Coleta de Dados</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            O <strong>Luan Sorteios</strong> coleta apenas as informações estritamente necessárias para o funcionamento seguro da plataforma e para garantir que os prêmios sejam entregues aos verdadeiros ganhadores.
          </p>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 mt-4">
            <h3 className="text-white font-bold mb-3">Dados que coletamos:</h3>
            <ul className="space-y-3 text-gray-300 text-sm md:text-base">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span><strong>Dados de Perfil:</strong> Nome, e-mail e foto do perfil (fornecidos automaticamente via Google Login).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span><strong>Dados de Contato:</strong> Número de telefone/WhatsApp (fornecido voluntariamente por você no seu perfil).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span><strong>Dados de Transação:</strong> Histórico de cotas adquiridas e status de pagamentos (processados de forma segura pelo Mercado Pago).</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary mb-6">
            <Lock className="w-8 h-8" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">2. Proteção e Segurança</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            Implementamos medidas de segurança de nível empresarial para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
          </p>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base mt-4">
            <strong>Não armazenamos dados bancários:</strong> Todo o processamento de pagamentos (PIX) é realizado diretamente nos servidores seguros do Mercado Pago. O Luan Sorteios não tem acesso aos seus dados bancários, senhas ou informações financeiras sensíveis.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary mb-6">
            <Eye className="w-8 h-8" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">3. Uso e Compartilhamento</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            Seus dados são utilizados exclusivamente para:
          </p>
          <ul className="space-y-3 mt-4 text-gray-300 text-sm md:text-base">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>Identificar você como o legítimo dono das cotas adquiridas.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>Entrar em contato caso você seja o ganhador de um de nossos sorteios.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>Enviar notificações importantes sobre suas compras e status dos sorteios.</span>
            </li>
          </ul>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base mt-4 font-bold text-primary">
            Nós NUNCA vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.
          </p>
        </section>
      </div>
    </div>
  );
}
