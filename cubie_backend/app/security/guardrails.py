"""
Security Guardrails for Cubie AI
Prevents prompt injection, system prompt leakage, and off-topic queries
"""

from typing import Dict, Any, Optional, List
import re
from enum import Enum
import os


class GuardrailViolation(Enum):
    """Types of guardrail violations"""
    PROMPT_INJECTION = "prompt_injection"
    SYSTEM_PROMPT_REQUEST = "system_prompt_request"
    OFF_TOPIC = "off_topic"
    INSTRUCTION_OVERRIDE = "instruction_override"
    ROLE_MANIPULATION = "role_manipulation"
    SAFE = "safe"


class GuardrailResult:
    """Result from guardrail check"""
    def __init__(
        self, 
        is_safe: bool, 
        violation_type: GuardrailViolation = GuardrailViolation.SAFE,
        confidence: float = 1.0,
        sanitized_query: Optional[str] = None,
        explanation: str = "",
        user_hint: str = ""
    ):
        self.is_safe = is_safe
        self.violation_type = violation_type
        self.confidence = confidence
        self.sanitized_query = sanitized_query
        self.explanation = explanation
        self.user_hint = user_hint  # Friendly hint for users
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_safe": self.is_safe,
            "violation_type": self.violation_type.value,
            "confidence": self.confidence,
            "sanitized_query": self.sanitized_query,
            "explanation": self.explanation,
            "user_hint": self.user_hint
        }


class CubieGuardrails:
    """
    Comprehensive guardrails for Cubie AI to prevent:
    1. Prompt injection attacks
    2. System prompt leakage
    3. Off-topic queries (non-cubing topics)
    4. Instruction override attempts
    5. Role manipulation
    """
    
    # Patterns for detecting prompt injection attempts
    PROMPT_INJECTION_PATTERNS = [
        # Direct instruction overrides
        r"ignore\s+(previous|above|all|your)\s+(instructions|prompts|rules|commands)",
        r"disregard\s+(previous|above|all|your)\s+(instructions|prompts|rules)",
        r"forget\s+(everything|all|previous|your)\s+(instructions|prompts|rules)",
        r"new\s+(instructions|prompts|rules|task|mission)",
        r"override\s+(instructions|prompts|rules|system)",
        
        # Role manipulation
        r"you\s+are\s+now\s+(a|an)",
        r"act\s+as\s+(a|an)\s+(?!cubing|speedcubing|timer|coach)",
        r"pretend\s+(to\s+be|you\s+are)",
        r"roleplay\s+as",
        r"simulate\s+(being|a|an)",
        
        # System access attempts
        r"show\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions|rules|guidelines)",
        r"what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions|rules)",
        r"reveal\s+(your|the)\s+(system\s+)?(prompt|instructions|rules)",
        r"display\s+(your|the)\s+(system\s+)?(prompt|instructions|rules)",
        r"print\s+(your|the)\s+(system\s+)?(prompt|instructions|rules)",
        r"tell\s+me\s+(your|the)\s+(system\s+)?(prompt|instructions|rules)",
        r"share\s+(your|the)\s+(system\s+)?(prompt|instructions|rules)",
        r"output\s+(your|the)\s+(system\s+)?(prompt|instructions|rules)",
        
        # Delimiter/escape attempts
        r"[<\[]/?system[>\]]",
        r"[<\[]/?assistant[>\]]",
        r"[<\[]/?user[>\]]",
        r"```system",
        r"---\s*system",
        
        # Backend/internal access attempts
        r"show\s+(me\s+)?your\s+(code|implementation|backend|database|api\s+keys)",
        r"access\s+(the\s+)?(database|backend|system|files)",
        r"run\s+(this\s+)?(code|command|script|query)",
        r"execute\s+(this\s+)?(code|command|script)",
    ]
    
    # Patterns for detecting system prompt requests
    SYSTEM_PROMPT_REQUEST_PATTERNS = [
        r"what\s+(are|were)\s+you\s+told",
        r"how\s+(are|were)\s+you\s+(programmed|configured|set\s+up|instructed)",
        r"what\s+(are|is)\s+your\s+(configuration|setup|programming|training)",
        r"who\s+(created|made|programmed|trained)\s+you",
        r"what\s+model\s+are\s+you",
        r"what\s+version\s+are\s+you",
        r"what\s+(is|are)\s+your\s+(capabilities|limitations|boundaries)",
        r"bypass\s+(your|the)\s+(safety|security|filters|guardrails)",
        r"(display|print|share)\s+(your|the)\s+(guidelines?|rules?|instructions?|message)",
        r"print\s+(your|the|my)\s+(system|prompt|instructions?)",
        r"what\s+instructions\s+(were|are)\s+you\s+given",
        r"(your|the)\s+internal\s+(rules?|guidelines?)",
    ]
    
    # Non-cubing topics (comprehensive list)
    OFF_TOPIC_PATTERNS = [
        # Politics & controversial topics
        r"\b(politics|political|election|democrat|republican|government|president|congress)\b",
        r"\b(liberal|conservative|left-wing|right-wing)\b",
        r"\b(vote|voting)\b",
        
        # Violence & harmful content
        r"\b(violence|violent|attack|kill|murder|weapon|bomb|terrorist|terrorism)\b",
        r"\b(harm|hurt|injure|abuse|assault)\b",
        
        # Adult/NSFW content
        r"\b(porn|sexual|nude|naked|xxx|adult\s+content)\b",
        
        # Illegal activities
        r"\b(drugs|cocaine|heroin|meth|marijuana|weed|illegal|crime|criminal|steal|theft)\b",
        r"\b(hack|hacking|crack|pirate|piracy)\b",
        
        # Financial advice
        r"\b(stock|stocks|invest|trading|crypto|bitcoin|financial\s+advice|forex)\b",
        
        # Medical advice
        r"\b(diagnose|diagnosis|treatment|cure|medication|prescription|medical\s+advice)\b",
        
        # Homework/academic dishonesty (unless cubing-related)
        r"\b(write\s+(my|a)\s+(essay|paper|homework|assignment))\b",
        r"\b(solve\s+(my|this)\s+(math|calculus|physics|homework|test))\b",
        r"\b(do\s+my\s+(physics|math|calculus|homework))\b",
        
        # Unrelated games/entertainment
        r"\b(fortnite|minecraft|roblox|pokemon|fifa|call\s+of\s+duty)\b",
        r"\b(video\s+game|gaming|console|playstation|xbox)\b",
        
        # Other general topics clearly unrelated to cubing
        r"\b(recipe|recipes|cooking|cuisine|restaurant|restaurants)\b",
        r"^(how\s+(do\s+i|to)\s+cook)\b",  # Cooking queries
        r"\b(pasta|pizza|bake|baking)\b",  # Food items
        r"\b(travel|vacation|hotel|flight|booking)\b",
        r"\b(dating|relationship|romance|tinder)\b",
        r"\b(astrology|horoscope|zodiac)\b",
        r"^(what'?s?\s+the\s+weather)\b",  # Weather queries
        r"\b(weather\s+(forecast|today|tomorrow))\b",
    ]
    
    # Cubing-related keywords (whitelist)
    CUBING_KEYWORDS = [
        # Core terms
        r"\b(cube|cubing|speedcubing|speedsolving|rubik|puzzle)\b",
        r"\b(timer|solve|scramble|algorithm|alg)\b",
        
        # Methods
        r"\b(cfop|roux|zz|petrus|beginner|advanced|method)\b",
        r"\b(f2l|oll|pll|cmll|coll|zbll|cross)\b",
        
        # Events
        r"\b(2x2|3x3|4x4|5x5|6x6|7x7|pyraminx|megaminx|skewb|square-1|clock)\b",
        r"\b(blindfolded|bld|one-handed|oh|fewest\s+moves|fm)\b",
        
        # Competition terms - expanded to catch competition names and queries
        r"\b(competition|comp|wca|world\s+cube\s+association)\b",
        r"\b(average|ao5|ao12|ao100|single|pb|personal\s+best)\b",
        r"\b(dnf|\+2|penalty|inspection|competitor|ranking)\b",
        r"\b(championship|nationals|worlds|open)\b",  # Competition types
        r"\b(tournament|event|round|heat|final)\b",  # Competition structure
        r"\b(registration|schedule|venue|location|date|result)\b",  # Competition info
        r"\b(organizer|delegate|judge|scrambler)\b",  # Competition roles
        r"\b(record|podium|winner|placement|qualify)\b",  # Competition outcomes
        # Pattern to match competition names (e.g., "Mumbai Winter Open 2025", "US Nationals 2024")
        r"(winter|summer|spring|fall|autumn)\s+(open|championship)",
        r"\b(open|championship|nationals)\s+20\d{2}\b",  # Year-based competitions
        r"\b20\d{2}\s+(open|championship|nationals)\b",  # Competitions with year
        
        # Training/improvement
        r"\b(practice|training|improve|improvement|consistency|recognition)\b",
        r"\b(look-ahead|finger-tricks|tps|turns\s+per\s+second)\b",
        r"\b(drill|session|progress|performance|analysis)\b",
        
        # Products
        r"\b(gan|moyu|qiyi|yj|yuxin|valk|tengyun|356|wrm|rs3m)\b",
        r"\b(magnetic|magnetized|stickerless|cube\s+review)\b",
        
        # Community
        r"\b(cuber|speedcuber|tutorial|guide|tips|tricks)\b",
        
        # CubeDev specific
        r"\b(cubedev|cubie)\b",
    ]
    
    def __init__(self, llm=None):
        """Initialize guardrails with compiled regex patterns and optional LLM"""
        self.injection_patterns = [
            re.compile(pattern, re.IGNORECASE) 
            for pattern in self.PROMPT_INJECTION_PATTERNS
        ]
        self.system_request_patterns = [
            re.compile(pattern, re.IGNORECASE) 
            for pattern in self.SYSTEM_PROMPT_REQUEST_PATTERNS
        ]
        self.off_topic_patterns = [
            re.compile(pattern, re.IGNORECASE) 
            for pattern in self.OFF_TOPIC_PATTERNS
        ]
        self.cubing_patterns = [
            re.compile(pattern, re.IGNORECASE) 
            for pattern in self.CUBING_KEYWORDS
        ]
        self.llm = llm  # Optional LLM for semantic relevance checking
        self._llm_cache = {}  # Cache LLM relevance results
    
    def check_query(self, query: str) -> GuardrailResult:
        """
        Comprehensive check of user query for security violations.
        
        Args:
            query: User's input query
        
        Returns:
            GuardrailResult with safety assessment
        """
        if not query or not query.strip():
            return GuardrailResult(
                is_safe=False,
                violation_type=GuardrailViolation.OFF_TOPIC,
                confidence=1.0,
                explanation="Empty query"
            )
        
        query_lower = query.lower().strip()
        
        # 1. Check for prompt injection attempts
        injection_check = self._check_prompt_injection(query_lower)
        if not injection_check.is_safe:
            return injection_check
        
        # 2. Check for system prompt requests
        system_check = self._check_system_prompt_request(query_lower)
        if not system_check.is_safe:
            return system_check
        
        # 3. Check for off-topic content
        topic_check = self._check_topic_relevance(query_lower)
        if not topic_check.is_safe:
            return topic_check
        
        # Query passes all checks
        return GuardrailResult(
            is_safe=True,
            violation_type=GuardrailViolation.SAFE,
            confidence=1.0,
            sanitized_query=query,
            explanation="Query passed all security checks"
        )
    
    def _check_prompt_injection(self, query: str) -> GuardrailResult:
        """Check for prompt injection attempts"""
        for pattern in self.injection_patterns:
            if pattern.search(query):
                return GuardrailResult(
                    is_safe=False,
                    violation_type=GuardrailViolation.PROMPT_INJECTION,
                    confidence=0.95,
                    explanation="Query contains potential prompt injection attempt",
                    user_hint="Your message seems to contain instructions. Please ask a cubing-related question instead."
                )
        
        # Check for role manipulation patterns
        if self._contains_role_manipulation(query):
            return GuardrailResult(
                is_safe=False,
                violation_type=GuardrailViolation.ROLE_MANIPULATION,
                confidence=0.9,
                explanation="Query attempts to manipulate assistant role",
                user_hint="I can only help with speedcubing. Please ask about cubing techniques, competitions, or training."
            )
        
        return GuardrailResult(is_safe=True)
    
    def _check_system_prompt_request(self, query: str) -> GuardrailResult:
        """Check for system prompt disclosure attempts"""
        for pattern in self.system_request_patterns:
            if pattern.search(query):
                return GuardrailResult(
                    is_safe=False,
                    violation_type=GuardrailViolation.SYSTEM_PROMPT_REQUEST,
                    confidence=0.9,
                    explanation="Query requests system prompt or internal configuration",
                    user_hint="I'm here to help with speedcubing! Ask me about solving techniques, competitions, or training instead."
                )
        
        # Additional heuristic checks
        suspicious_phrases = [
            "initial prompt", "original prompt", "base prompt",
            "hidden instructions", "secret instructions",
            "internal guidelines", "backend instructions"
        ]
        
        for phrase in suspicious_phrases:
            if phrase in query:
                return GuardrailResult(
                    is_safe=False,
                    violation_type=GuardrailViolation.SYSTEM_PROMPT_REQUEST,
                    confidence=0.85,
                    explanation="Query attempts to access system configuration",
                    user_hint="Let's focus on cubing! Ask me about algorithms, competition info, or improving your times."
                )
        
        return GuardrailResult(is_safe=True)
    
    def _check_topic_relevance(self, query: str) -> GuardrailResult:
        """
        Check if query is related to cubing/speedcubing.
        
        Uses intelligent hybrid approach:
        1. Check for explicitly off-topic patterns (blacklist) - fast rejection
        2. Check for obvious cubing keywords (whitelist) - fast approval
        3. Allow harmless general queries (greetings, small talk)
        4. For ambiguous queries, use LLM semantic check if available
        5. Default to allowing queries that don't match blacklist (better UX)
        """
        # Check for explicitly off-topic content (high confidence block)
        for pattern in self.off_topic_patterns:
            if pattern.search(query):
                return GuardrailResult(
                    is_safe=False,
                    violation_type=GuardrailViolation.OFF_TOPIC,
                    confidence=0.95,
                    explanation="Query is about non-cubing topics",
                    user_hint="This doesn't seem to be about cubing. Try asking about Rubik's cubes, competitions, or solving techniques!"
                )
        
        # Check if query is about cubing (always allow)
        has_cubing_keywords = any(
            pattern.search(query) for pattern in self.cubing_patterns
        )
        
        if has_cubing_keywords:
            return GuardrailResult(is_safe=True)
        
        # For queries without cubing keywords, check if they're harmless general queries
        # Allow: greetings, small talk, general questions that don't violate blacklist
        harmless_patterns = [
            r"^(hi|hey|hello|good\s+(morning|afternoon|evening))",
            r"^(thanks|thank\s+you|ty)",
            r"^(bye|goodbye|see\s+you)",
            r"^(how\s+are\s+you|what'?s\s+up)",
            r"^(help|can\s+you\s+help)",
            r"^(what\s+can\s+you\s+do)",
        ]
        
        for pattern_str in harmless_patterns:
            if re.search(pattern_str, query, re.IGNORECASE):
                return GuardrailResult(is_safe=True)
        
        # For ambiguous queries without obvious cubing keywords:
        # Use LLM-based semantic check if available (better UX, understands context)
        if self.llm and len(query) > 15:  # Only use LLM for substantial queries
            # Check cache first
            cache_key = f"relevance_{hash(query)}"
            if cache_key in self._llm_cache:
                return self._llm_cache[cache_key]
            
            try:
                llm_result = self._check_semantic_relevance(query)
                self._llm_cache[cache_key] = llm_result
                return llm_result
            except Exception as e:
                # Fall through to heuristic checks if LLM fails
                print(f"LLM relevance check failed: {e}")
        
        # Fallback heuristics for queries without LLM
        # Check for proper nouns (might be competition names, cuber names, etc.)
        proper_noun_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*'
        has_proper_nouns = re.search(proper_noun_pattern, query)
        
        # Check for information-seeking patterns
        question_patterns = [
            r'\b(details?|info|information|tell\s+me|about|when|where|schedule|how|what|who|which)\b',
            r'\b(give\s+me|show\s+me|explain|describe)\b',
        ]
        
        has_question_words = any(
            re.search(pattern, query, re.IGNORECASE) 
            for pattern in question_patterns
        )
        
        # If query has proper nouns + question words, likely legitimate
        # (e.g., "tell me about Mumbai Winter Open 2025")
        if has_proper_nouns and has_question_words:
            return GuardrailResult(is_safe=True, confidence=0.75)
        
        # For queries > 40 chars without any cubing indicators, be more cautious
        # But still allow them - let the router agent decide if it can help
        if len(query) > 40:
            return GuardrailResult(
                is_safe=True,  # Changed to True for better UX
                confidence=0.5,
                explanation="Query may not be about cubing, but allowing for router to assess"
            )
        
        # Default: allow queries that didn't match blacklist
        # Better to be permissive and let specialized agents handle routing
        return GuardrailResult(is_safe=True, confidence=0.6)
    
    def _check_semantic_relevance(self, query: str) -> GuardrailResult:
        """
        Use LLM to check semantic relevance to speedcubing.
        This provides intelligent context understanding without keyword matching.
        
        Args:
            query: User's query text
            
        Returns:
            GuardrailResult indicating if query is cubing-related
        """
        relevance_prompt = f"""You are a content moderator for a speedcubing AI assistant named Cubie AI.

Your task: Determine if the following user query is related to speedcubing, Rubik's cubes, puzzles, or competitions.

Guidelines:
- ACCEPT: Queries about cubing techniques, competitions, timers, algorithms, cube products, WCA, solving methods, cubers, events, training, etc.
- ACCEPT: Competition names (e.g., "Mumbai Winter Open 2025", "US Nationals"), even without explicit cubing keywords
- ACCEPT: Questions about specific cubers, competition results, or rankings
- ACCEPT: General questions that could reasonably be interpreted in a cubing context
- ACCEPT: Greetings, follow-ups, or clarifications about previous cubing topics
- REJECT: Clearly off-topic queries about politics, violence, adult content, illegal activities, unrelated games, cooking, dating, etc.

User query: "{query}"

Respond with ONLY one word:
- "RELEVANT" if the query is related to speedcubing/cubing
- "IRRELEVANT" if the query is clearly about something else

Your response:"""

        try:
            response = self.llm.invoke(relevance_prompt)
            result_text = response.content.strip().upper()
            
            if "RELEVANT" in result_text:
                return GuardrailResult(
                    is_safe=True,
                    confidence=0.9,
                    explanation="LLM determined query is cubing-related"
                )
            else:
                return GuardrailResult(
                    is_safe=False,
                    violation_type=GuardrailViolation.OFF_TOPIC,
                    confidence=0.85,
                    explanation="LLM determined query is not about cubing",
                    user_hint="This doesn't seem to be about cubing. Try asking about Rubik's cubes, competitions, or solving techniques!"
                )
        except Exception as e:
            # On error, be permissive
            print(f"LLM semantic check error: {e}")
            return GuardrailResult(
                is_safe=True,
                confidence=0.5,
                explanation="LLM check failed, allowing query"
            )
    
    def _contains_role_manipulation(self, query: str) -> bool:
        """Check for role manipulation attempts"""
        role_patterns = [
            r"you\s+are\s+now\s+(a|an)\s+(?!cubing|speedcubing|timer|coach|assistant)",
            r"pretend\s+(to\s+be|you\s+are)\s+(a|an)\s+(?!cubing|speedcubing|timer|coach)",
            r"act\s+like\s+(a|an)\s+(?!cubing|speedcubing|timer|coach)",
        ]
        
        for pattern_str in role_patterns:
            if re.search(pattern_str, query, re.IGNORECASE):
                return True
        
        return False
    
    def get_safe_response(self, violation_type: GuardrailViolation) -> str:
        """
        Get appropriate safe response based on violation type.
        Provides clear explanation so users can rephrase if needed.
        
        Args:
            violation_type: Type of guardrail violation
        
        Returns:
            User-friendly response message with explanation
        """
        responses = {
            GuardrailViolation.PROMPT_INJECTION: (
                "I noticed your message contains instructions that might conflict with my purpose. "
                "I'm Cubie AI, designed specifically to help with speedcubing.\n\n"
                "I can assist you with:\n"
                "• Solving techniques and methods (CFOP, Roux, etc.)\n"
                "• Algorithm practice and recommendations\n"
                "• Competition information and WCA data\n"
                "• Performance analysis and training plans\n"
                "• Cube reviews and product recommendations\n\n"
                "Could you rephrase your question to focus on cubing? I'm here to help! 🧩"
            ),
            GuardrailViolation.SYSTEM_PROMPT_REQUEST: (
                "I'm designed to focus on helping you with speedcubing rather than discussing "
                "how I work internally.\n\n"
                "I can help you with:\n"
                "• Solve time analysis and improvement tips\n"
                "• WCA competition schedules and results\n"
                "• Learning algorithms and techniques\n"
                "• Training recommendations and practice routines\n"
                "• Cube recommendations and reviews\n\n"
                "What speedcubing topic would you like to explore? 🧩"
            ),
            GuardrailViolation.OFF_TOPIC: (
                "I noticed your question isn't related to speedcubing or puzzles. "
                "I'm specialized in helping cubers improve their skills!\n\n"
                "I can help you with:\n"
                "• Rubik's cube solving methods and tutorials\n"
                "• Competition information and rankings\n"
                "• Your personal solve times and progress\n"
                "• Algorithm training and recognition\n"
                "• Cube hardware recommendations\n\n"
                "Do you have any cubing-related questions? Feel free to ask! 🧩"
            ),
            GuardrailViolation.INSTRUCTION_OVERRIDE: (
                "I'm focused on speedcubing assistance. Let me help you with:\n"
                "• Improving your solve times\n"
                "• Learning new methods and algorithms\n"
                "• Competition preparation\n"
                "• Performance analysis\n"
                "• Cubing techniques and tips\n\n"
                "What would you like to know about cubing? 🧩"
            ),
            GuardrailViolation.ROLE_MANIPULATION: (
                "I'm Cubie AI, your dedicated speedcubing coach and assistant. "
                "I specialize in helping cubers like you improve!\n\n"
                "I can assist with:\n"
                "• Training plans and practice strategies\n"
                "• Analyzing your solve data\n"
                "• Competition guidance\n"
                "• Learning resources and tutorials\n"
                "• Technique improvement\n\n"
                "What cubing challenge can I help you with today? 🧩"
            ),
        }
        
        return responses.get(
            violation_type,
            "I'm specialized in speedcubing assistance. Could you rephrase your question "
            "to focus on cubing topics? I'm here to help with solve techniques, competitions, "
            "training, and more! 🧩"
        )


# Global instance
_guardrails = None

def get_guardrails(llm=None) -> CubieGuardrails:
    """
    Get singleton instance of guardrails.
    
    Args:
        llm: Optional LLM instance for semantic relevance checking.
             If provided on first call, will be used for all subsequent calls.
    
    Returns:
        CubieGuardrails instance
    """
    global _guardrails
    if _guardrails is None:
        _guardrails = CubieGuardrails(llm=llm)
    elif llm is not None and _guardrails.llm is None:
        # Update LLM if provided later
        _guardrails.llm = llm
    return _guardrails
