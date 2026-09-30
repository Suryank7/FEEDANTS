"""
Streamlit Chat UI — Interactive chatbot interface for the Agentic AI eBook.

Usage:
    streamlit run app/streamlit_app.py
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import streamlit as st
from app.graph.workflow import rag_graph
from app.retrieval.vector_store import vector_store
from app.config import settings


# ─── Page Configuration ─────────────────────────────────────────────

st.set_page_config(
    page_title="Agentic AI RAG Chatbot",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Custom CSS ──────────────────────────────────────────────────────

st.markdown("""
<style>
    .main-header {
        text-align: center;
        padding: 1rem 0;
    }
    .confidence-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-weight: 600;
        font-size: 0.85rem;
    }
    .high-conf { background: #22c55e22; color: #16a34a; border: 1px solid #22c55e; }
    .med-conf  { background: #f59e0b22; color: #d97706; border: 1px solid #f59e0b; }
    .low-conf  { background: #ef444422; color: #dc2626; border: 1px solid #ef4444; }
    .source-chip {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        margin: 0.15rem;
        border-radius: 0.5rem;
        background: #6366f122;
        color: #6366f1;
        border: 1px solid #6366f1;
        font-size: 0.8rem;
    }
    .stChatMessage { max-width: 100%; }
</style>
""", unsafe_allow_html=True)


# ─── Sidebar ─────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("## 🤖 Agentic AI Chatbot")
    st.markdown("---")
    st.markdown(
        "Ask questions about the **Agentic AI eBook**. "
        "All answers are strictly grounded in the eBook content."
    )
    st.markdown("---")

    # Vector store status
    health = vector_store.health_check()
    if health.get("status") == "healthy":
        st.success(f"✅ Vector store: {health.get('vector_count', 0)} chunks")
    else:
        st.error("❌ Vector store not ready. Run ingestion first.")

    st.markdown("---")
    st.markdown("**📚 Knowledge Base**")
    st.markdown("Agentic AI eBook by Konverge.ai")
    st.markdown("---")

    st.markdown("**⚙️ Settings**")
    st.caption(f"LLM: {settings.LLM_MODEL}")
    st.caption(f"Embedding: {settings.EMBEDDING_MODEL}")
    st.caption(f"Top-K: {settings.TOP_K}")
    st.caption(f"Relevance Threshold: {settings.RELEVANCE_THRESHOLD}")

    if st.button("🗑️ Clear Chat History"):
        st.session_state.messages = []
        st.session_state.history = []
        st.rerun()


# ─── Main Chat Area ─────────────────────────────────────────────────

st.markdown('<div class="main-header"><h1>🤖 Agentic AI RAG Chatbot</h1></div>', unsafe_allow_html=True)
st.caption("Ask me anything about the Agentic AI eBook — answers are grounded exclusively in the document.")

# Initialise session state
if "messages" not in st.session_state:
    st.session_state.messages = []
if "history" not in st.session_state:
    st.session_state.history = []

# Render chat history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

        if msg["role"] == "assistant" and "metadata" in msg:
            meta = msg["metadata"]

            # Confidence badge
            conf = meta.get("confidence", 0)
            if conf >= 0.7:
                badge_class = "high-conf"
            elif conf >= 0.4:
                badge_class = "med-conf"
            else:
                badge_class = "low-conf"

            st.markdown(
                f'<span class="confidence-badge {badge_class}">'
                f'Confidence: {conf:.0%}</span>',
                unsafe_allow_html=True,
            )

            # Sources
            sources = meta.get("sources", [])
            if sources:
                source_chips = " ".join(
                    f'<span class="source-chip">📄 Page {s["page"]}</span>'
                    for s in sources
                )
                st.markdown(f"**Sources:** {source_chips}", unsafe_allow_html=True)

            # Expandable retrieved context
            with st.expander("📑 View Retrieved Context"):
                for i, chunk in enumerate(meta.get("retrieved_context", []), 1):
                    st.markdown(
                        f"**Chunk {i}** — Page {chunk.get('page', '?')} | "
                        f"Score: {chunk.get('score', 0):.4f}"
                    )
                    st.text(chunk.get("content", "")[:400])
                    st.markdown("---")


# Chat input
if prompt := st.chat_input("Ask about the Agentic AI eBook…"):
    # Display user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Run RAG pipeline
    with st.chat_message("assistant"):
        with st.spinner("Searching eBook & generating answer…"):
            try:
                result = rag_graph.invoke({
                    "user_query": prompt,
                    "conversation_history": st.session_state.history,
                })

                answer = result.get("final_answer", "An error occurred.")
                confidence = result.get("confidence", 0.0)
                sources = result.get("sources", [])
                retrieved = result.get("retrieved_chunks", [])

                st.markdown(answer)

                # Confidence
                if confidence >= 0.7:
                    badge_class = "high-conf"
                elif confidence >= 0.4:
                    badge_class = "med-conf"
                else:
                    badge_class = "low-conf"

                st.markdown(
                    f'<span class="confidence-badge {badge_class}">'
                    f'Confidence: {confidence:.0%}</span>',
                    unsafe_allow_html=True,
                )

                # Sources
                if sources:
                    source_chips = " ".join(
                        f'<span class="source-chip">📄 Page {s["page"]}</span>'
                        for s in sources
                    )
                    st.markdown(f"**Sources:** {source_chips}", unsafe_allow_html=True)

                # Retrieved context
                with st.expander("📑 View Retrieved Context"):
                    for i, chunk in enumerate(retrieved, 1):
                        st.markdown(
                            f"**Chunk {i}** — Page {chunk.get('page', '?')} | "
                            f"Score: {chunk.get('score', 0):.4f}"
                        )
                        st.text(chunk.get("content", "")[:400])
                        st.markdown("---")

                # Save to session
                metadata = {
                    "confidence": confidence,
                    "sources": sources,
                    "retrieved_context": [
                        {
                            "page": c.get("page", 0),
                            "score": c.get("score", 0),
                            "content": c.get("content", "")[:400],
                        }
                        for c in retrieved
                    ],
                }
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": answer,
                    "metadata": metadata,
                })

                # Update conversation history
                st.session_state.history.append({"role": "user", "content": prompt})
                st.session_state.history.append({"role": "assistant", "content": answer})

                # Trim history
                max_hist = settings.MAX_CONVERSATION_HISTORY * 2
                if len(st.session_state.history) > max_hist:
                    st.session_state.history = st.session_state.history[-max_hist:]

            except Exception as exc:
                st.error(f"❌ Error: {str(exc)}")
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": f"Error: {str(exc)}",
                })
