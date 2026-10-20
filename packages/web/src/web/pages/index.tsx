import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  Coins,
  Compass,
  Crown,
  Hourglass,
  Medal,
  Plus,
  ScrollText,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Swords,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  useGuild,
  useAccept,
  useComplete,
  useRename,
  useSaveReward,
  useDeleteReward,
  useRedeem,
  useCompleteElite,
} from "../queries/guild";

type Tab = "posto" | "loja" | "perfil";
const cats = ["Todas", "Programação", "Francês", "Livro", "Memory Architect"];
const catClass: Record<string, string> = {
  Programação: "code",
  Francês: "french",
  Livro: "book",
  "Memory Architect": "memory",
};
const elite = [
  {
    key: "forge" as const,
    name: "A Forja Ininterrupta",
    detail: "Estude programação por 12 horas em uma semana, em pelo menos quatro dias.",
    period: "Semanal",
    xp: 100,
    copper: 80,
  },
  {
    key: "voice" as const,
    name: "A Voz de Outro Mundo",
    detail: "Conclua 12 Active Listening e 8 Language Islands no mesmo mês.",
    period: "Mensal",
    xp: 120,
    copper: 90,
  },
  {
    key: "manuscript" as const,
    name: "O Manuscrito Renascido",
    detail: "Conclua duas revisões do livro e prepare a versão para leitores.",
    period: "Única vez",
    xp: 200,
    copper: 150,
  },
];
function levelFor(xp: number) {
  const thresholds = [0, 250, 550, 900, 1300, 1800];
  while (thresholds[thresholds.length - 1] <= xp) {
    const step = 500 + (thresholds.length - 5) * 100;
    thresholds.push(thresholds[thresholds.length - 1] + step);
  }
  const level = thresholds.findIndex((v, i) => xp < (thresholds[i + 1] ?? Infinity)) + 1;
  return { level, current: thresholds[level - 1], next: thresholds[level] };
}
const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T12:00:00Z`),
  );
const money = (c: number) =>
  `${Math.floor(c / 100)} prata${Math.floor(c / 100) === 1 ? "" : "s"} · ${c % 100} cobre${c % 100 === 1 ? "" : "s"}`;
function Index() {
  const data = useGuild();
  const accept = useAccept(),
    complete = useComplete(),
    rename = useRename(),
    save = useSaveReward(),
    remove = useDeleteReward(),
    redeem = useRedeem(),
    eliteAction = useCompleteElite();
  const [tab, setTab] = useState<Tab>("posto");
  const [category, setCategory] = useState("Todas"),
    [status, setStatus] = useState("Pendentes"),
    [search, setSearch] = useState("");
  const [editing, setEditing] = useState<number | null>(null),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [price, setPrice] = useState("");
  const [editName, setEditName] = useState(false),
    [profileName, setProfileName] = useState("");
  const [notice, setNotice] = useState("");
  const notify = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 5000);
  };
  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      notify(success);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Não foi possível salvar. Tente novamente.");
    }
  };
  if (data.isLoading)
    return (
      <div className="loading">
        <Compass size={42} />
        <h2>Abrindo os registros da Guilda…</h2>
      </div>
    );
  if (data.isError || !data.data)
    return (
      <div className="loading">
        <h2>Não foi possível abrir a Guilda.</h2>
        <p>{data.error?.message}</p>
        <button onClick={() => data.refetch()}>Tentar novamente</button>
      </div>
    );
  const d = data.data,
    person = d.person,
    progression = levelFor(person.xp);
  const completedMonth = d.quests.filter((q) => q.status === "completed").length;
  const filtered = d.quests.filter(
    (q) =>
      (category === "Todas" || q.category === category) &&
      (status === "Todos" ||
        (status === "Pendentes" && q.status !== "completed") ||
        (status === "Concluídos" && q.status === "completed")) &&
      q.title.toLowerCase().includes(search.toLowerCase()),
  );
  const busy =
    accept.isPending ||
    complete.isPending ||
    rename.isPending ||
    save.isPending ||
    remove.isPending ||
    redeem.isPending ||
    eliteAction.isPending;
  const nav = [
    { id: "posto" as Tab, label: "Posto de Serviços", icon: ScrollText },
    { id: "loja" as Tab, label: "Loja de Recompensas", icon: ShoppingBag },
    { id: "perfil" as Tab, label: "Meu Perfil", icon: UserRound },
  ];
  const resetForm = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setPrice("");
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Compass size={29} strokeWidth={1.4} />
          </div>
          <div>
            <span className="eyebrow">A GUILDA DOS</span>
            <strong>
              QUATRO
              <br />
              CAMINHOS
            </strong>
          </div>
        </div>
        <div className="side-rule">✦ &nbsp; EST. MMXXVI &nbsp; ✦</div>
        <div className="side-label">NAVEGAÇÃO</div>
        <nav className="side-nav">
          {nav.map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "active" : ""}
              onClick={() => setTab(n.id)}
            >
              <n.icon size={19} />
              {n.label}
              <ChevronRight size={15} className="nav-chevron" />
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="side-label">SEU REGISTRO</div>
          <div className="avatar-row">
            <div className="avatar">
              <Shield size={22} />
            </div>
            <div>
              <strong>{person.name}</strong>
              <small>Aventureiro · Nível {progression.level}</small>
            </div>
          </div>
          <div className="sidebar-currency">
            <Coins size={18} />
            <span>{person.copper} cobres</span>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="mobile-brand">✦ &nbsp; A GUILDA DOS QUATRO CAMINHOS</div>
          <div className="breadcrumb">
            A GUILDA DOS QUATRO CAMINHOS <span> / </span>{" "}
            {tab === "posto"
              ? "POSTO DE SERVIÇOS"
              : tab === "loja"
                ? "LOJA DE RECOMPENSAS"
                : "PERFIL"}
          </div>
          <div className="top-right">
            <span className="date-pill">
              <Compass size={14} />
              {monthLabel(d.month)}
            </span>
            <span className="coin-pill">
              <Coins size={17} />
              {person.copper} C
            </span>
          </div>
        </header>
        {tab === "posto" && (
          <div className="content">
            <div className="hero">
              <div className="hero-text">
                <div className="eyebrow light">
                  ✦ &nbsp; QUADRO DE MISSÕES · {monthLabel(d.month).toUpperCase()}
                </div>
                <h1>Posto de Serviços</h1>
                <p>Um contrato de cada vez. Quatro caminhos à sua espera.</p>
                <div className="hero-line" />
                <span className="hero-footer">
                  ESCOLHA SEU PRÓXIMO PASSO &nbsp; ✦ &nbsp; O PROGRESSO COMEÇA AQUI
                </span>
              </div>
              <div className="hero-emblem">
                <Compass size={118} strokeWidth={0.65} />
                <span>IV</span>
              </div>
            </div>
            <div className="stats">
              <div className="stat">
                <ScrollText />
                <div>
                  <strong>{d.quests.length}</strong>
                  <span>CONTRATOS DO MÊS</span>
                </div>
              </div>
              <div className="stat">
                <Check />
                <div>
                  <strong>{completedMonth}</strong>
                  <span>CONCLUÍDOS</span>
                </div>
              </div>
              <div className="stat">
                <Sparkles />
                <div>
                  <strong>{person.xp}</strong>
                  <span>XP ACUMULADO</span>
                </div>
              </div>
              <div className="stat">
                <Coins />
                <div>
                  <strong>{person.copper}</strong>
                  <span>COBRES DISPONÍVEIS</span>
                </div>
              </div>
            </div>
            <div className="section-title">
              <div>
                <span className="eyebrow">INVENTÁRIO DO MÊS</span>
                <h2>
                  Contratos disponíveis <span className="title-swish">✦</span>
                </h2>
                <p>Encontre uma missão, aceite o chamado e registre sua conquista.</p>
              </div>
              <span className="count-stamp">{filtered.length} FICHAS</span>
            </div>
            <div className="filter-bar">
              <div className="category-filters">
                {cats.map((c) => (
                  <button
                    key={c}
                    className={category === c ? "selected" : ""}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="filter-bottom">
                <div className="search">
                  <Search size={16} />
                  <input
                    aria-label="Buscar contratos"
                    placeholder="Buscar contrato..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="status-tabs">
                  {["Pendentes", "Concluídos", "Todos"].map((s) => (
                    <button
                      key={s}
                      className={status === s ? "chosen" : ""}
                      onClick={() => setStatus(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="quest-grid">
              {filtered.map((q) => (
                <article className={`quest-card ${catClass[q.category]} ${q.status}`} key={q.id}>
                  <div className="quest-ribbon">
                    <span>
                      {q.category === "Programação"
                        ? "⚙"
                        : q.category === "Francês"
                          ? "⚜"
                          : q.category === "Livro"
                            ? "▣"
                            : "✥"}{" "}
                      &nbsp; {q.category.toUpperCase()}
                    </span>
                    <span className="quest-number">Nº {q.id.split("-").at(-1)}</span>
                  </div>
                  <div className="quest-body">
                    <div className="quest-top">
                      <h3>{q.title}</h3>
                      <div className="seal">
                        <Shield size={24} strokeWidth={1.25} />
                      </div>
                    </div>
                    <p className="quest-desc">
                      {q.category === "Programação"
                        ? "Tempo dedicado à arte de construir e resolver."
                        : q.category === "Francês"
                          ? "Explore o idioma, escute e avance com intenção."
                          : q.category === "Livro"
                            ? "Leitura e escrita: uma página de cada vez."
                            : "Cultive a memória e amplie seu palácio mental."}
                    </p>
                    <div className="quest-meta">
                      <span>
                        <Hourglass size={14} />
                        {q.minutes} MIN
                      </span>
                      <strong>+{q.xp} XP</strong>
                      <strong>+{q.copper} C</strong>
                    </div>
                    <div className="quest-foot">
                      <span>
                        {q.status === "completed"
                          ? `CONCLUÍDO · ${new Date(q.completedAt!).toLocaleDateString("pt-BR")}`
                          : q.status === "active"
                            ? "EM ANDAMENTO"
                            : "DISPONÍVEL"}
                      </span>
                      <button
                        disabled={busy || q.status === "completed"}
                        onClick={() =>
                          run(
                            () =>
                              q.status === "available"
                                ? accept.mutateAsync({ id: q.id })
                                : complete.mutateAsync({ id: q.id }),
                            q.status === "available"
                              ? "Contrato aceito."
                              : `Contrato concluído! +${q.xp} XP e +${q.copper} cobres.`,
                          )
                        }
                      >
                        {q.status === "completed" ? (
                          <>
                            <Check size={15} /> Concluído
                          </>
                        ) : q.status === "active" ? (
                          "Concluir missão"
                        ) : (
                          "Aceitar quest"
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="empty">Nenhum contrato encontrado para estes filtros.</div>
            )}
            <div className="section-title elite-heading">
              <div>
                <span className="eyebrow">ALÉM DO CAMINHO COMUM</span>
                <h2>
                  Contratos Elite <span className="title-swish">✦</span>
                </h2>
                <p>Desafios opcionais, com confirmação manual e recompensa por período.</p>
              </div>
              <span className="count-stamp">03 DESAFIOS</span>
            </div>
            <div className="elite-grid">
              {elite.map((e) => {
                const period =
                  e.key === "forge" ? d.periods.week : e.key === "voice" ? d.periods.month : "once";
                const done = d.achievements.some((a) => a.id === `${e.key}-${period}`);
                return (
                  <article className="elite-card" key={e.key}>
                    <span className="elite-period">✦ {e.period.toUpperCase()}</span>
                    <div className="elite-icon">
                      <Crown size={27} />
                    </div>
                    <h3>{e.name}</h3>
                    <p>{e.detail}</p>
                    <div className="elite-meta">
                      <span>+{e.xp} XP</span>
                      <span>+{e.copper} C</span>
                    </div>
                    <button
                      disabled={done || busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Confirmar que você cumpriu “${e.name}”? A recompensa só será concedida uma vez neste período.`,
                          )
                        )
                          run(
                            () => eliteAction.mutateAsync({ contract: e.key }),
                            "Contrato Elite concluído!",
                          );
                      }}
                    >
                      {done ? "Conquista registrada" : "Confirmar conclusão"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        )}
        {tab === "loja" && (
          <div className="content">
            <div className="page-heading">
              <span className="eyebrow">✦ &nbsp; A TENDA DO MERCADOR</span>
              <h1>Loja de Recompensas</h1>
              <p>Seu esforço merece bons momentos. Troque cobres por pequenas alegrias.</p>
            </div>
            <div className="shop-banner">
              <div>
                <span>SUA BOLSA</span>
                <strong>
                  <Coins size={28} />
                  {person.copper} <small>cobres</small>
                </strong>
                <p>{money(person.copper)} · 100 cobres = 1 prata</p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setEditing(-1);
                }}
              >
                <Plus size={17} /> Nova recompensa
              </button>
            </div>
            {editing !== null && (
              <div className="form-panel">
                <div className="form-heading">
                  <h3>{editing === -1 ? "Cadastrar recompensa" : "Editar recompensa"}</h3>
                  <button onClick={resetForm} aria-label="Fechar">
                    <X size={20} />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => {
                      await save.mutateAsync({
                        id: editing === -1 ? undefined : editing,
                        name,
                        description,
                        price: Number(price),
                      });
                      resetForm();
                    }, "Recompensa salva.");
                  }}
                >
                  <label>
                    Nome
                    <input
                      required
                      minLength={2}
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-label="Nome da recompensa"
                        placeholder="Ex.: Uma tarde livre"
                    />
                  </label>
                  <label>
                    Descrição (opcional)
                    <input
                      maxLength={240}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      aria-label="Descrição da recompensa"
                        placeholder="Um pequeno lembrete do prêmio"
                    />
                  </label>
                  <label>
                    Preço em cobres
                    <input
                      required
                      type="number"
                      min="1"
                      max="100000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      aria-label="Preço em cobres"
                        placeholder="25"
                    />
                  </label>
                  <button className="primary" disabled={busy}>
                    {save.isPending ? "Salvando..." : "Salvar recompensa"}
                  </button>
                </form>
              </div>
            )}
            <div className="section-title">
              <div>
                <span className="eyebrow">ESCOLHA SEU PRÊMIO</span>
                <h2>
                  Vitrine do mercador <span className="title-swish">✦</span>
                </h2>
                <p>Recompensas personalizadas podem ser editadas ou removidas.</p>
              </div>
              <span className="count-stamp">{d.rewards.length} ITENS</span>
            </div>
            <div className="reward-grid">
              {d.rewards.map((r, i) => (
                <article className="reward-card" key={r.id}>
                  <div className="reward-top">
                    <div className="reward-icon">
                      {i % 4 === 0 ? (
                        <Sparkles />
                      ) : i % 4 === 1 ? (
                        <BookOpen />
                      ) : i % 4 === 2 ? (
                        <Medal />
                      ) : (
                        <Swords />
                      )}
                    </div>
                    <span>{r.custom ? "PERSONALIZADA" : "RECOMPENSA"}</span>
                  </div>
                  <h3>{r.name}</h3>
                  <p>{r.description || "Um merecido descanso após a jornada."}</p>
                  <div className="reward-bottom">
                    <strong>
                      <Coins size={17} />
                      {r.price} <small>cobres</small>
                    </strong>
                    <button
                      disabled={busy || person.copper < r.price}
                      onClick={() => {
                        if (window.confirm(`Resgatar “${r.name}” por ${r.price} cobres?`))
                          run(
                            () => redeem.mutateAsync({ id: r.id }),
                            "Resgate registrado. Aproveite seu prêmio!",
                          );
                      }}
                    >
                      {person.copper < r.price
                        ? "Saldo insuficiente"
                        : redeem.isPending
                          ? "Resgatando..."
                          : "Resgatar"}
                    </button>
                  </div>
                  {r.custom && (
                    <div className="reward-edit">
                      <button
                        onClick={() => {
                          setEditing(r.id);
                          setName(r.name);
                          setDescription(r.description);
                          setPrice(String(r.price));
                        }}
                      >
                        Editar
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Excluir “${r.name}”? O histórico de compras será preservado.`,
                            )
                          )
                            run(() => remove.mutateAsync({ id: r.id }), "Recompensa removida.");
                        }}
                      >
                        <Trash2 size={13} /> Excluir
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
            <div className="section-title history-title">
              <div>
                <span className="eyebrow">MEMÓRIAS DA JORNADA</span>
                <h2>Histórico de resgates</h2>
              </div>
            </div>
            <div className="history-list">
              {d.purchases.length ? (
                d.purchases.map((p) => (
                  <div className="history-row" key={p.id}>
                    <ShoppingBag size={18} />
                    <strong>{p.name}</strong>
                    <span>{new Date(p.purchasedAt).toLocaleDateString("pt-BR")}</span>
                    <b>−{p.price} C</b>
                  </div>
                ))
              ) : (
                <div className="empty">
                  Ainda não há resgates. Sua primeira recompensa espera por você.
                </div>
              )}
            </div>
          </div>
        )}
        {tab === "perfil" && (
          <div className="content">
            <div className="page-heading">
              <span className="eyebrow">✦ &nbsp; O LIVRO DE REGISTROS</span>
              <h1>Perfil do Aventureiro</h1>
              <p>Cada missão concluída deixa sua marca nesta jornada.</p>
            </div>
            <div className="profile-card">
              <div className="profile-seal">
                <Shield size={52} strokeWidth={1} />
              </div>
              <div className="profile-info">
                <span className="eyebrow">AVENTUREIRO DA GUILDA</span>
                <div className="name-line">
                  {editName ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(async () => {
                          await rename.mutateAsync({ name: profileName });
                          setEditName(false);
                        }, "Nome atualizado.");
                      }}
                    >
                      <input
                        aria-label="Nome do aventureiro"
                        required
                        minLength={2}
                        maxLength={48}
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                      />
                      <button disabled={busy}>Salvar</button>
                    </form>
                  ) : (
                    <>
                      <h2>{person.name}</h2>
                      <button
                        onClick={() => {
                          setProfileName(person.name);
                          setEditName(true);
                        }}
                      >
                        Editar nome
                      </button>
                    </>
                  )}
                </div>
                <span className="level-badge">NÍVEL {progression.level}</span>
                <div className="progress-head">
                  <span>PROGRESSO PARA O NÍVEL {progression.level + 1}</span>
                  <b>
                    {person.xp} / {progression.next} XP
                  </b>
                </div>
                <div className="progress-track">
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, ((person.xp - progression.current) / (progression.next - progression.current)) * 100))}%`,
                    }}
                  />
                </div>
                <small>Faltam {progression.next - person.xp} XP para subir de nível</small>
              </div>
            </div>
            <div className="profile-stats">
              <div>
                <Sparkles />
                <strong>{person.xp}</strong>
                <span>XP TOTAL</span>
              </div>
              <div>
                <Coins />
                <strong>{person.copper}</strong>
                <span>COBRES ATUAIS</span>
              </div>
              <div>
                <ScrollText />
                <strong>{d.completed}</strong>
                <span>QUESTS CONCLUÍDAS</span>
              </div>
              <div>
                <Crown />
                <strong>{d.achievements.length}</strong>
                <span>CONTRATOS ELITE</span>
              </div>
            </div>
            <div className="profile-columns">
              <div>
                <div className="section-title">
                  <div>
                    <span className="eyebrow">CRÔNICAS DA GUILDA</span>
                    <h2>Meses anteriores</h2>
                  </div>
                </div>
                <div className="paper-list">
                  {d.monthly.length ? (
                    d.monthly.map((m) => (
                      <div key={m.month}>
                        <span>{monthLabel(m.month)}</span>
                        <strong>{m.count} contratos concluídos</strong>
                      </div>
                    ))
                  ) : (
                    <div className="empty">Sua história começa neste mês.</div>
                  )}
                </div>
              </div>
              <div>
                <div className="section-title">
                  <div>
                    <span className="eyebrow">HONRAS CONQUISTADAS</span>
                    <h2>Contratos Elite</h2>
                  </div>
                </div>
                <div className="paper-list">
                  {d.achievements.length ? (
                    d.achievements.map((a) => (
                      <div key={a.id}>
                        <span>
                          {elite.find((e) => e.key === a.contract)?.name}{" "}
                          <small>· {a.period}</small>
                        </span>
                        <strong>
                          +{a.xp} XP · +{a.copper} C
                        </strong>
                      </div>
                    ))
                  ) : (
                    <div className="empty">Nenhum contrato Elite concluído ainda.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <nav className="mobile-nav">
        {nav.map((n) => (
          <button
            key={n.id}
            className={tab === n.id ? "active" : ""}
            onClick={() => {
              setTab(n.id);
              window.scrollTo(0, 0);
            }}
          >
            <n.icon size={21} />
            <span>{n.id === "posto" ? "Posto" : n.id === "loja" ? "Loja" : "Perfil"}</span>
          </button>
        ))}
      </nav>
      {notice && (
        <output className="toast">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Fechar aviso">
            <X size={15} />
          </button>
        </output>
      )}
    </div>
  );
}
export default Index;
