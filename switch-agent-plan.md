# 🏗️ PLAN INFRASTRUCTURE MULTI-AGENTS IA PERSONNALISÉS

## 🎯 Vision

Permettre à l'utilisateur de :
- **Configurer son serveur LLM** (URL, clé API, modèle)
- **Switcher entre agents** (Hermes ↔ OpenClaw ↔ Custom)
- **Choisir son modèle** dans chaque agent
- **Partager mémoire/skills** automatiquement entre agents
- **Créer ses propres agents** via l'interface

---

## 🏢 Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                   ANTI-GRAVITY PLATFORM                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  USER DASHBOARD                                  │   │
│  │  ┌─────────────────────────────────────────────┐  │   │
│  │  │  AGENT MANAGER                         │  │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐   │  │   │
│  │  │  │ Hermes │  │ OpenClaw │  │ Custom │   │  │   │
│  │  │  │ [LLM]  │  │ [LLM]  │  │ [LLM]  │   │  │   │
│  │  │  └────────┘  └────────┘  └────────┘   │  │   │
│  │  └─────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  SHARED STORES   │  │  CUSTOM AGENTS    │                │
│  │  (Zustand)       │  │  (User-Created)  │                │
│  │                  │  │                   │                │
│  │ • Messages       │  │ • Agent Generator  │                │
│  │ • Skills         │  │ • Skill Builder    │                │
│  │ • Memory         │  │ • MCP Config       │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
├─────────────────────────────────────────────────────────────┤
│  LLM PROVIDERS        │  MCP SERVERS            │ TOOLS     │
│  • OpenRouter         │  • Custom MCP          │ • Browser  │
│  • Anthropic          │  • Browserbase         │ • Terminal │
│  • OpenAI             │  • Notion              │ • Files    │
│  • Local (Ollama)     │  • Git                 │ • API      │
│  • User Custom        │  • User-defined        │ • DB       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 SECTION 1 : Configuration Sécurisée

### 1.1 Endpoint d'authentification
```
POST /api/auth/server-config
{
  "serverUrl": "https://mon-serveur-llm.com/api/v1",
  "apiKey": "sk-xxx",        // Chiffré côté serveur
  "model": "gpt-4.1-mini",
  "agentType": "openclaw|hermes|custom",
  "validateSSL": true
}
```

### 1.2 Validation & Protection
- **Chiffrement API key** : AES-256-GCM côté serveur
- **Validation SSL** : Option pour serveurs self-signed
- **Rate limiting** : 10 reqs/minute par IP
- **Whitelist URLs** : Seulement protocols autorisés

### 1.3 Secure Storage
```typescript
// src/lib/security/encrypted-store.ts
class EncryptedCredentialStore {
  private encrypt(data: string, key: string): string
  private decrypt(encrypted: string, key: string): string
  private validateUrl(url: string): boolean  // Check protocol whitelist
}
```

---

## 🎛️ SECTION 2 : Agent Manager Interface

### 2.1 Composants UI

```tsx
// src/components/AgentManager/
├── AgentSwitcher.tsx        // Bouton principal + dropdown
├── AgentSelector.tsx        // Page configuration agents
├── ModelPicker.tsx          // Sélecteur de modèle LLM
├── ServerConfigForm.tsx     // Form configuration serveur
└── AgentCreator.tsx         // Création d'agent personnalisé
```

### 2.2 AgentSwitcher Design
```tsx
interface AgentSwitcherProps {
  currentAgent: AgentConfig
  availableAgents: AgentConfig[]
  onAgentChange: (agent: AgentConfig) => void
  onAddCustom: () => void
}

// UI:
// [🦀 Hermes Agent ▼]  ← Bouton principal
//   ↓
//  ┌─────────────────────────┐
//  │ 🦀 Hermes Agent       │
//  │ ✅ Connecté           │
//  │ Model: poolside/laguna │
//  │ └── Changer de modèle   │
//  │                       │
//  │ 🤖 OpenClaw           │
//  │ 🔴 Non configuré      │
//  │ └── Configurer serveur  │
//  │                       │
//  │ ➕ Ajouter agent perso │
//  └─────────────────────────┘
```

### 2.3 Model Picker
```tsx
// Liste des modèles disponibles via le serveur configuré
const fetchModels = async (serverConfig: ServerConfig) => {
  const response = await fetch(`${serverConfig.url}/models`, {
    headers: { 'Authorization': `Bearer ${serverConfig.apiKey}` }
  })
  return response.json()
}
```

---

## 🧠 SECTION 3 : Mémoire & Skills Partagés

### 3.1 SharedMemoryProvider (format universel)
```typescript
interface UniversalAgentContext {
  // Messages unifiés
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: number
    agentId?: string
    metadata?: any
  }>
  
  // Skills universels
  skills: Array<{
    id: string
    name: string
    version: string
    triggers: string[]
    steps: Array<{
      tool: string
      params: Record<string, any>
    }>
    // Compatible avec tous les agents
  }>
  
  // Memory persistante
  memory: {
    longTerm: Record<string, any>
    user: Record<string, any>  // Préférences utilisateur
    context: Record<string, any>
  }
  
  // Configuration active
  activeConfig: {
    primaryAgent: string
    agentConfigs: Record<string, AgentConfig>
  }
}
```

## ⚠️ LIMITATIONS RÉELLES - SECTION ADDITIONNELLE

### 3.2 Sync Automatique (AVEC LIMITATIONS)
```typescript
// src/lib/services/universal-sync.ts
class UniversalSync {
  // Sync bidirectionnel
  async syncToAllAgents(context: AgentContext, scope: 'global' | 'project' | 'private') {
    // ⚠️ PAS 100% universel - limitations connues
    const promises = this.agents.map(async agent => {
      try {
        const converted = await this.convertContext(context, agent.type, scope)
        // Certaines propriétés peuvent ne pas exister sur certains agents
        return this.partialSync(agent, converted)
      } catch (error) {
        // Log l'erreur mais continue - graceful degradation
        console.warn(`Sync partial for ${agent.id}: ${error.message}`)
        return { success: false, skipped: this.getUnavailableFeatures(agent.type) }
      }
    })
    return Promise.allSettled(promises)
  }
  
  // ⚠️ ATTENTION : Conversion PARTIELLE uniquement
  convertContext(context: AgentContext, agentType: string, scope: string) {
    const base = {
      messages: this.filterMessages(context.messages, scope),
      memory: this.filterMemory(context.memory, scope)
      // ⚠️ SKILLS et TOOLS souvent NON convertibles
      // Hermes skills ≠ OpenClaw workflows ≠ MCP tools
    }
    
    switch(agentType) {
      case 'hermes': 
        return {
          ...base,
          system_prompts: this.extractSystemPrompts(context),
          skills_available: [] // ⚠️ À reconstruire manuellement
        }
      case 'openclaw':
        return {
          ...base,
          instructions: this.extractInstructions(context),
          mcp_tools: [] // ⚠️ Format différent
        }
      default: return base
    }
  }
  
  // Fonctionnalités non disponibles par agent
  getUnavailableFeatures(agentType: string): string[] {
    const limitations = {
      hermes: ['mcp_tools', 'workflows'],
      openclaw: ['skills', 'memory_format'],
      custom: ['unknown_format']
    }
    return limitations[agentType] || []
  }
}
```

### Granularité Mémoire (obligatoire)
```typescript
// src/lib/stores/useAgentMemoryStore.ts

interface ScopedMemory {
  global: SharedContext     // Visible par tous agents
  project: Record<string, SharedContext>  // Par projet
  private: Record<string, SharedContext>  // Par agent (non sync)
  sync_config: {
    include_messages: boolean
    include_memory: boolean
    include_skills: boolean  // ⚠️ Souvent NON syncable
    agents_target: string[]  // Agents concernés
  }
}

// Exemple d'utilisation :
// Hermes → mémoire globale + project
// Claude Code → mémoire project seulement
// Agent Custom → mémoire privée + sélection manuelle
```

### 4.3 Skill Converter LIMITÉ
```typescript
// ⚠️ ATTENTION : Ce n'est PAS vraiment universel
interface UniversalSkillAdapter {
  // Ce qui SE POURRA peut-être convertir
  convertBasic(dry_run: true): ConversionReport // Toujours tester d'abord
  
  // Ce qui ne sera PAS convertible
  getNonConvertible(): string[] // ['mcp_tools', 'workflows', ...]
  
  // Manual reconstruction needed
  manualSteps: string[]  // Instructions pour compléter manuellement
}
```

---

## 🔒 SÉCURITÉ CLÉS API - SECTION CRITIQUE

### Stockage des credentials (OBLIGATOIRE)
```typescript
// src/lib/security/secure-credential-store.ts

class SecureCredentialStore {
  // ⚠️ JAMAIS dans le localStorage ou le frontend
  private readonly KEY_ROTATION_DAYS = 90
  
  // Chiffrement AES-256-GCM
  private encryptCredential(value: string, userSalt: string): string {
    // Key dérivée du mot de passe utilisateur + salt
    // Stocké uniquement côté serveur (never exposed)
  }
  
  // Rotation automatique
  async rotateKeysIfNeeded() {
    const lastRotation = await this.getLastRotation()
    if (Date.now() - lastRotation > this.KEY_ROTATION_DAYS * 86400000) {
      await this.triggerKeyRotation()
    }
  }
  
  // Validation serveur
  validateServerUrl(url: string): boolean {
    // Whitelist protocols: https://, wss://
    // Blacklist: localhost, 127.0.0.1, 192.168.x.x
    // ⚠️ Pour usage public, enlever les URLs internes
  }
  
  // Logs minimaux (jamais les clés)
  private logAccess(userId: string, action: string) {
    // Log: "user X added server config" 
    // JAMAIS: "user X used key sk-xxxxx"
    // Retenu 30 jours max puis purge
  }
}
```

### Headers de sécurité API
```typescript
// ⚠️ Protection contre le vol de clés
const SECURE_HEADERS = {
  'X-API-Key': 'REDACTED',  // Never expose real key
  'Authorization': 'REDACTED', // Never expose real auth
  'Content-Type': 'application/json'
  // Les vraies clés utilisées côté serveur uniquement
}
```

### Rate limiting & abuse prevention
```typescript
// src/middleware/rate-limit.ts
const RATE_LIMITS = {
  server_configs: '5 per hour per user',  // Config serveur
  agent_creations: '10 per day per user',   // Agents créés
  api_calls: '100 per minute per IP',       // Calls LLM
  sync_requests: '20 per minute per user'   // Sync mémoire
}
```

---

## 📊 GRANULARITÉ SYCHRONISATION (ÉTOFFÉ)

### Options de sync pour utilisateur
```tsx
// Page Settings → Memory & Sync
<MemorySyncSettings>
  <ScopeSelector>
    ├── Global (tous agents)
    ├── Par projet (agents du projet)
    └── Privé (agent seulement)
  </ScopeSelector>
  
  <SyncOptions>
    ☐ Messages (✅ toujours syncable)
    ☐ Mémoire utilisateur (✅ toujours syncable)
    ☐ Skills (⚠️ parfois non syncable - averti)
    ☐ Workflows (⚠️ rarement syncable - averti)
    ☐ Tools/MCP (⚠️ très rarement - averti)
  </SyncOptions>
  
  <ConversionWarnings>
    {conversionReport.nonConvertible.map(feature => (
      <Warning>
        ⚠️ {feature} non syncable avec cet agent - 
        reconstruction manuelle nécessaire
      </Warning>
    ))}
  </ConversionWarnings>
</MemorySyncSettings>
```

---

## 🛡️ PLAN DE SÉCURITÉ IMPLÉMENTATION

### Semaine 1 : Sécurité de base
- [ ] Chiffrement AES-256-GCM côté serveur
- [ ] Rate limiting middleware
- [ ] Validation URLs whitelist
- [ ] Logs sécurisés (sans clés)
- [ ] Tests penetration basiques

### Semaine 2 : Auth renforcée  
- [ ] 2FA optionnel pour serveur public
- [ ] Session timeout 30min
- [ ] CSRF tokens sur formulaires
- [ ] Content Security Policy headers

### Semaine 3 : Monitoring
- [ ] Audit logs des changements config
- [ ] Alertes tentatives d'accès
- [ ] Rotation clés automatique
- [ ] Backup chiffré quotidien

---

## 🛠️ SECTION 4 : Système de Skills Universel

### 4.1 Skill Converter
```typescript
// src/lib/services/skill-converter.ts
class SkillConverter {
  // Hermes → Universal
  hermesToUniversal(hermesSkill: any): UniversalSkill
  
  // OpenClaw → Universal  
  openclawToUniversal(openclawSkill: any): UniversalSkill
  
  // Universal → Hermes
  universalToHermes(skill: UniversalSkill): HermesSkill
  
  // Universal → OpenClaw
  universalToOpenClaw(skill: UniversalSkill): OpenClawSkill
}
```

### 4.2 Skill Builder UI
```tsx
// src/components/SkillBuilder/SkillBuilder.tsx
// Interface pour créer des skills compatibles tous agents
{
  - Nom du skill
  - Triggers (mots-clés)
  - Étapes (drag-drop)
  - Types de sortie
  - Options avancées
}
```

---

## 👾 SECTION 5 : Création d'Agents Personnalisés

### 5.1 Agent Generator
```tsx
// src/components/AgentCreator/AgentCreator.tsx

interface CustomAgentConfig {
  id: string
  name: string
  description: string
  systemPrompt: string        // Prompt système custom
  skills: string[]            // Skills à inclure
  tools: string[]             // Outils autorisés
  model: string               // Modèle LLM à utiliser
  serverUrl?: string          // Options serveur custom
  agentSpecificConfig?: any   // Config supplémentaire
}
```

### 5.2 Création d'agent via interface
```
Agent Creator Steps:
1. Nommer l'agent
2. Définir le prompt système
3. Sélectionner les skills (existants ou nouveaux)
4. Choisir les outils (browser, terminal, files, DB...)
5. Configurer le modèle LLM
6. Tester l'agent
7. Sauvegarder
```

### 5.3 Agent Runtime
```typescript
// src/lib/agents/custom-agent-runtime.ts
class CustomAgentRuntime {
  private agentConfig: CustomAgentConfig
  private messageHistory: Message[]
  
  async run(prompt: string, context: any) {
    // Construire le prompt avec contexte unifié
    const fullPrompt = this.buildPrompt(prompt, context)
    
    // Appeler le serveur LLM configuré
    const response = await this.callLLM(fullPrompt)
    
    return this.parseResponse(response)
  }
  
  private buildPrompt(prompt: string, context: UniversalAgentContext) {
    return `
${this.agentConfig.systemPrompt}
      
Contexte partagé:
${JSON.stringify(context.memory)}
      
Messages récents:
${context.messages.slice(-20).map(m => `${m.role}: ${m.content}`).join('\n')}
      
Question: ${prompt}
    `
  }
}
```

---

## 🔌 SECTION 6 : Intégration MCP Serveurs

### 6.1 MCP Connector
```typescript
// src/lib/services/mcp-connector.ts

// Configuration MCP utilisateur
interface MCPServerConfig {
  id: string
  name: string
  url: string
  apiKey?: string
  tools: string[]  // Outils à exposer
  enabled: boolean
}

// Registration automatique
async function registerMCPServers(configs: MCPServerConfig[]) {
  for (const config of configs) {
    if (config.enabled) {
      await fetch('/api/mcp/add', {
        method: 'POST',
        body: JSON.stringify(config)
      })
    }
  }
}
```

### 6.2 Servers supportés
- ✅ Browserbase (browser automation)
- ✅ Notion (documents)
- ✅ Git (versioning)
- ✅ PostgreSQL/SQLite (database)
- ✅ Email (SMTP/IMAP)
- ✅ Custom MCP (via URL)

---

## 📊 SECTION 7 : Monitoring & Analytics

```tsx
// src/components/AgentDashboard/AgentDashboard.tsx

{
  Metrics par agent:
    - Temps de réponse moyen
    - Tokens consommés
    - Erreurs de sync
    - Utilisation des tools
  
  Status agents:
    - Connecté/Déconnecté
    - Latence
    - Dernière activité
  
  Logs:
    - Messages échangés
    - Erreurs de sync
    - Modifications skills
}
```

---

## 🚀 SECTION 8 : Déploiement & Échelle

### 8.1 Infrastructure
```
Frontend: Nginx + Vite preview
Backend: FastAPI + Uvicorn
WebSocket: ws://same-host (port 8002)
Database: SQLite (single) → PostgreSQL (scale)
Cache: Redis (pour sessions multiples)
```

### 8.2 Ports configurés
```bash
# Port 8001 - Frontend + API principale
# Port 8002 - WebSocket (sync temps réel)
# Port 8003 - MCP Bridge (si nécessaire)
# Port 9000 - Yahoo Finance Proxy (déjà existant)
```

---

## 💰 SECTION 9 : Coûts & Ressources

| Composant | Coût mensuel estimé |
|-----------|-------------------|
| Serveur VPS (Hostinger) | 5-10€ |
| LLM API (OpenRouter) | 10-50€ selon usage |
| MCP Services | 0-20€ (certaines gratuites) |
| Bandwidth | 5€ (déjà inclus) |
| **Total** | **15-85€/mois** |

---

## ⚠️ SECTION 10 : Limitations Techniques

| Limite | Solution |
|--------|----------|
| Pas d'API Claude publique | Spawn CLI via child_process |
| Format skills différents | Converter universel |
| Sync conflits | Timestamps + dernier gagne |
| Rate limiting serveurs | Queue + retry avec backoff |
| Coûts LLM | Cache + économie tokens |

---

## 📋 SECTION 11 : Checklist Développement

### Backend (Semaine 1-2)
- [ ] Route `/api/auth/server-config` (endpoint sécurisé)
- [ ] Route `/api/agents/*` (CRUD agents)
- [ ] Route `/api/context/sync` (sync mémoire)
- [ ] WebSocket `/ws/sync` (temps réel)
- [ ] Service `EncryptedCredentialStore`
- [ ] Service `UniversalSync`
- [ ] Service `SkillConverter`
- [ ] Service `MCPConnector`

### Frontend (Semaine 2-3)
- [ ] Composant `AgentSwitcher`
- [ ] Composant `AgentSelector`
- [ ] Composant `ModelPicker`
- [ ] Composant `ServerConfigForm`
- [ ] Composant `AgentCreator`
- [ ] Composant `SkillBuilder`
- [ ] Store Zustand `useAgentStore`
- [ ] Store Zustand `useSharedMemoryStore`

### Intégration (Semaine 3-4)
- [ ] Connecter à Hermes (via CLI spawn)
- [ ] Connecter à OpenClaw (via API)
- [ ] Connecter aux serveurs LLM custom
- [ ] Tests de basculement
- [ ] Tests de sync mémoire
- [ ] Documentation utilisateur

---

## 🎯 Commandes de démarrage

```bash
# 1. Créer structure projet
mkdir -p src/{components,lib,services,pages/api/agents}

# 2. Dépendances backend
pip install fastapi uvicorn websockets cryptography aiohttp

# 3. Dépendances frontend  
npm install zustand @radix-ui/react-dropdown-menu

# 4. Démarrer serveur WS
uvicorn ws_server:app --port 8002 --host 0.0.0.0

# 5. Tester
npm run dev
```

---

## 🔄 SECTION 12 : Workflow Multi-Agents & Délégation Visuelle

### Vision Workflow
```
┌─────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW DASHBOARD                                            X       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  AGENT 1        │  │  AGENT 2        │  │  AGENT 3        │     │
│  │  Hermes         │  │  OpenClaw       │  │  Custom         │     │
│  │                 │  │                 │  │                 │     │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │     │
│  │ │📋 Tâche A   │ │  │ │📋 Tâche B   │ │  │ │📋 Tâche C   │ │     │
│  │ │✅ Complétée  │ │  │ │🔄 En cours   │ │  │ │⏳ En attente │ │     │
│  │ │👤 Deleguée à:│ │  │ │📥 Reçue de:  │ │  │ │📤 À déléguer│ │     │
│  │ │👁️ Visible:oui│ │  │ │👁️ Visible:non│ │  │ │👁️ Visible:oui│ │     │
│  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  TASK DETAIL VIEW                                                │  │
│  │  ┌───────────────────────────────────────────────────────────┐  │  │
│  │  │ Task: Refactor authentication logic                      │  │  │
│  │  │ Status: 🔄 In Progress                                  │  │  │
│  │  │ Owner: OpenClaw                                           │  │  │
│  │  │                                                         │  │  │
│  │  │ History:                                                 │  │  │
│  │  │ • Hermes created this task                               │  │  │
│  │  │ • OpenClaw claimed ownership                             │  │  │
│  │  │ • Visible to: Hermes, Custom                            │  │  │
│  │  │ • Hidden from: None                                     │  │  │
│  │  │                                                         │  │  │
│  │  │ Actions:                                                 │  │  │
│  │  │ [Re-déléguer] [Marquer visible/invisible] [Terminer]      │  │  │
│  │  └───────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 12.1 Task avec visibilité et ownership

```typescript
// src/lib/stores/useTaskWorkflowStore.ts
interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  assignedTo: string  // agent id
  createdBy: string   // agent id
  visibility: {
    visibleTo: string[]   // agents qui peuvent voir
    hiddenFrom: string[]  // agents qui ne peuvent pas voir
  }
  delegateHistory: Array<{
    from: string
    to: string
    timestamp: number
    reason?: string
  }>
  createdAt: number
  updatedAt: number
}

// Actions disponibles
delegateTask(taskId: string, toAgentId: string)
setVisibility(taskId: string, visibleTo: string[], hiddenFrom: string[])
transferOwnership(taskId: string, toAgentId: string)
getTasksVisibleTo(agentId: string): Task[]
```

### 12.2 Task Visibility Matrix

```tsx
// src/components/TaskVisibility/TaskVisibilityMatrix.tsx
// Grid qui montre qui voit quoi
<VisibilityMatrix>
  <AgentColumns agents={['hermes', 'openclaw', 'custom-1', 'custom-2']} />
  <TaskRows tasks={tasks} />
  {/* Click sur cellule pour changer visibilité */}
</VisibilityMatrix>
```

### 12.3 Delegation Dashboard

```tsx
// src/components/DelegationDashboard/DelegationDashboard.tsx
{
  // Vue Kanban par agent
  views: {
    'All Tasks': tasks,
    'My Tasks': tasks.filter(t => t.assignedTo === currentAgent),
    'Delegated by me': tasks.filter(t => t.createdBy === currentAgent),
    'Visible to me': tasks.filter(t => t.visibility.visibleTo.includes(currentAgent))
  },
  
  // Filtres
  filters: {
    status: ['pending', 'in-progress', 'completed'],
    agent: ['hermes', 'openclaw', 'all-custom'],
    visibility: ['all', 'visible-only', 'hidden-from-me']
  }
}
```

### 12.4 Visual Workflow Builder

```tsx
// src/components/WorkflowBuilder/WorkflowBuilder.tsx
// Drag-drop pour créer workflows entre agents
<WorkflowCanvas>
  <AgentNode id="hermes" label="Hermes" color="orange" />
  <AgentNode id="openclaw" label="OpenClaw" color="blue" />
  
  <Connection from="hermes" to="openclaw" 
    label="Delegate task when confidence < 0.7" />
    
  <TaskNode id="task-1" title="Analyze code" 
    owner="hermes" 
    visibleTo={['hermes', 'openclaw']}
    onDragComplete={(targetAgent) => delegateTask('task-1', targetAgent)}
  />
</WorkflowCanvas>
```

---

## 📋 SECTION 13 : Commandes clés pour workflow

### Création d'un workflow
```bash
# 1. Créer le store de tâches
touch src/lib/stores/useTaskWorkflowStore.ts

# 2. Composants UI
mkdir -p src/components/{TaskVisibility,DelegationDashboard,WorkflowBuilder}

# 3. API routes
touch src/pages/api/tasks/{delegate,visibility,assign}.ts

# 4. WebSocket pour updates temps réel
# (ajouté au ws_server existant)
```

### Actions rapides depuis n'importe quel agent
```
Slash commands dans chat :

/delegate <task_id> @agent-name        # Déléguer une tâche
/visibility <task_id> show/hide @all   # Changer visibilité
/tasks show all                       # Voir toutes les tâches visibles
/tasks filter status=in-progress      # Filtrer par status
/workflow create from-current-task      # Créer un workflow depuis contexte
```

---

## 🎯 SECTION 14 : Intégration Kanban Hermes

### Mapping avec hermes kanban existant
```typescript
// Hermes kanban → Task workflow mapping
kanbanMapping = {
  hermesKanbanTask: Task,
  assign: 'assignedTo',
  block/unblock: 'status',
  comment: 'delegateHistory.push',  
  complete: 'status = completed',
  link: 'dependencies'
}
```

### Commandes CLI compatibles
```bash
# Synchroniser avec hermes kanban
hermes kanban list                    # Liste tâches
hermes kanban assign ID AGENT         # Assigner à un agent
hermes kanban delegate ID TO_AGENT    # Déléguer (feature à ajouter)
hermes kanban visibility ID SHOW|@ALL # Visibilité
```

---

## 🚀 Section 15 : Quick Start Commands

```bash
# 1. Structure workflow
mkdir -p src/{components/{TaskVisibility,DelegationDashboard},lib/{stores,services/workflow}}

# 2. Dépendances nécessaires  
npm install @dnd-kit/core @dnd-kit/sortable zustand

# 3. Backend FastAPI workflow
touch src/pages/api/tasks/workflow.py

# 4. Tester le système
npm run dev
# Aller sur /dashboard/workflow
```

---

## ⚠️ SECTION 16 : PROBLÈMES CRITIQUES & SOLUTIONS

### 🚨 Problème 1 : Formats Skills Différents

```typescript
// Hermes Skill Format
interface HermesSkill {
  name: string
  description: string
  triggers: string[]
  content: string  // Markdown + code
  version: string
  created_by: "agent" | "hub"
}

// OpenClaw Skill Format  
interface OpenClawSkill {
  name: string
  pattern: string  // Regex pattern
  workflow: object[]  // JSON workflow
  actions: string[]  // Liste d'actions
}

// Custom Agent Skill (arbitraire !)
interface CustomSkill {
  id?: string
  instructions?: string[]
  tools?: string[]
  // Format totalement libre selon le LLM
}
```

**⛔ Impossible de convertir automatiquement** - chaque agent a son format propre !

### ✅ Solution : Universal Skill Registry

```typescript
// src/lib/services/universal-skill-registry.ts
class UniversalSkillRegistry {
  // Format de base que TOUS les agents peuvent lire
  private universalFormat: UniversalSkill = {
    id: string           // Universal ID
    name: string         // Nom affichable
    description: string  // Description utilisateur
    category: string     // "finance" | "code" | "research" etc
    capabilities: string[] // ["read-file", "execute-code", "web-search"]
    
    // Version agent-spécifique (pas convertie, juste référencée)
    agentVersions: {
      hermes: { format: "native", content: "...", lastSync: 0 },
      openclaw: { format: "native", content: "...", lastSync: 0 },
      custom: { format: "native", content: "...", lastSync: 0 }
    }
  }
  
  // UI montre UN skill, backend fait le lien avec chaque agent
  getSkillReferences(skillId: string): AgentSkillRef[]
}
```

---

### 🚨 Problème 2 : Skills Nativement Incompatibles

```
SKILLS QUI NE PEUVENT PAS ÊTRE PARTAGÉS:

Hermes:
  ❌ MCP tools (stdio bridge uniquement)
  ❌ Shell hooks (scripts locaux)
  ❌ File system direct

OpenClaw:
  ❌ Workflows propriétaires
  ❌ Tool definitions internes
  ❌ System prompts spécifiques

Custom Agents:
  ❌ Format totalement arbitraire
  ❌ Dépend du LLM sous-jacent
```

### ✅ Solution : Categorisation Skills

```typescript
// Skills classés par type de compatibilité
const skillCompatibility = {
  universal: {  // Fonctionnent partout
    description: "Text + instructions simples",
    sync: "✅ Possible",
    examples: ["Révision brevet", "Calcul financier", "Traduction"]
  },
  
  agentSpecific: {  // Nécessitent recréation
    description: "Tools, MCP, workflows propriétaires",
    sync: "⚠️ Recréer manuellement",
    examples: ["Browser automation", "Git operations", "MCP connectors"]
  },
  
  incompatible: {   // Ne peuvent pas être synchronisés
    description: "Format trop différent",
    sync: "❌ Impossible",
    examples: ["Hermes skills avec MCP", "OpenClaw workflows"]
  }
}
```

---

### 🚨 Problème 3 : Mémoire Universelle vs Agent-Faite

```typescript
// Mémoire Universelle (commun aux tous)
interface UniversalMemory {
  userPreferences: any
  conversationHistory: Message[]
  projectContext: any
}

// Mémoire Agent-Faite (spécifique)
interface AgentSpecificMemory {
  hermes: {
    skillUsage: Record<string, number>
    mcpState: Record<string, any>
    toolHistory: any[]
  }
  openclaw: {
    workflowProgress: Record<string, any>
    patternMatches: string[]
    executionHistory: any[]
  }
  custom: {
    // Format arbitraire - inconnu
  }
}
```

### ✅ Solution : Mémoire Stratifiée

```
Architecture mémoire :

┌─────────────────────────────────────┐
│  UNIVERSAL CONTEXT (partagé)        │
│  ─ preferences                     │
│  ─ messages                       │
│  ─ project context                │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  AGENT CONTEXT (par agent)         │
│  ─ skills compatibles              │
│  ─ état workflow                  │
│  ─ configurations               │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  NATIVE STORAGE (agent only)        │
│  ─ skills propres                 │
│  ─ outils propres                  │
│  ─ cache LLM                     │
└─────────────────────────────────────┘
```

---

## 🎯 Workflow avec Limitations Affichées

### UI pour montrer les limitations
```tsx
// src/components/SkillCompatibility/SkillCompatibilityBadge.tsx
<CompatibilityBadge skill={skill}>
  <StatusBadge type={
    compatible: "✅ Universel",
    partial: "⚠️ Partiellement compatible", 
    incompatible: "❌ Agent-spécifique"
  } />
  
  {skill.compatibility.agentSpecific && (
    <Tooltip>
      Actif sur: {skill.compatibility.agents.join(', ')}
      Visible sur: {skill.compatibility.visibleTo.join(', ')}
      À recréer pour: {skill.compatibility.toRecreate.join(', ')}
    </Tooltip>
  )}
</CompatibilityBadge>
```

### Sync Actions possibles
```tsx
// Menu contextuel sur chaque skill
<SkillActions skill={skill}>
  <button onClick={syncAllCompatible}>
    Sync vers agents compatibles
  </button>
  <button onClick={showManualSteps}>
    Show manual recreation steps
  </button>
  <button onClick={makeUniversal}>
    Make universal copy
  </button>
</SkillActions>
```

---

## 🔧 Plan de Contournement

### 1. Skills Universels (recommandé)
```bash
# Utiliser uniquement les skills "text-only" 
# qui peuvent être injectés comme prompt système

SKILL_TYPE = "text-prompt"  # ✅ Universel
SKILL_TYPE = "workflow"     # ❌ Agent-spécifique
SKILL_TYPE = "mcp-tool"     # ❌ Agent-spécifique
```

### 2. Import/Export Skills
```typescript
// Export universel (format texte)
{
  format: "universal-skill-v1",
  content: "# Instructions\n\nFais ceci...",
  metadata: {
    name: "Analyse code",
    category: "code",
    compatibleWith: ["all"]
  }
}
```

### 3. Reconnaissance automatique incompatible
```typescript
// Analyse le skill et détecte si incompatible
function analyzeSkillCompatibility(skill: any, targetAgent: string): CompatibilityReport {
  const issues = []
  
  if (skill.usesMCP) issues.push("MCP tools not available")
  if (skill.usesNativeWorkflow) issues.push("Native workflow")
  if (skill.agentSpecific) issues.push("Agent-specific format")
  
  return {
    compatible: issues.length === 0,
    warnings: issues,
    suggestedAlternatives: findAlternatives(skill, targetAgent)
  }
}
```

---

## ✅ Ce qui marche VRAIMENT

| Fonction | Status | Pourquoi |
|----------|--------|----------|
| Messages universels | ✅ | Tout agent comprend le texte |
| Préférences utilisateur | ✅ | Key-value simple |
| Skills texte seulement | ✅ | Injectables comme prompt |
| Délégation tâches | ✅ | Logique métier pure |
| Switcher agent | ✅ | UI pure |
| Mémoire globale | ✅ | Partagée comme contexte |
| Skills natifs complets | ⚠️ | **Conversion PARTielle + warnings** |

---

## 🛠️ Commandes pour commencer MVP

```bash
# 1. Copie de travail avec warnings
cp /root/switch-agent-plan.md /root/multi-agent-mvp-plan.md

# 2. Focus sur skills universels
mkdir -p skills-universal/{text,code,finance,general}

# 3. UI avec badges compatibilité
# Montrer clairement ce qui est compatible
```

---

Le plan final inclut **toutes les limitations** dans `/root/switch-agent-plan.md` - 889 lignes maintenant !

**Prochain step** : On développe les componsants avec affichage des limitations, ou on creuse un aspect en particulier ?