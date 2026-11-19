import logging
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.checkpoint.memory import MemorySaver

from .schema import State
from .nodes import (
    router_node,
    route_next,
    research_node,
    orchestrator_node,
    worker_node,
    merge_content,
    decide_images,
    generate_and_place_images,
    fanout,
)
from .database import get_database_url

logger = logging.getLogger(__name__)

# -----------------------------
# 1) Reducer Subgraph
# -----------------------------
reducer_graph = StateGraph(State)
reducer_graph.add_node("merge_content", merge_content)
reducer_graph.add_node("decide_images", decide_images)
reducer_graph.add_node("generate_and_place_images", generate_and_place_images)

reducer_graph.add_edge(START, "merge_content")
reducer_graph.add_edge("merge_content", "decide_images")
reducer_graph.add_edge("decide_images", "generate_and_place_images")
reducer_graph.add_edge("generate_and_place_images", END)

reducer_subgraph = reducer_graph.compile()


# -----------------------------
# 2) Main Graph
# -----------------------------
g = StateGraph(State)
g.add_node("router", router_node)
g.add_node("research", research_node)
g.add_node("orchestrator", orchestrator_node)
g.add_node("worker", worker_node)
g.add_node("reducer", reducer_subgraph)

g.add_edge(START, "router")
g.add_conditional_edges(
    "router", 
    route_next, 
    {"research": "research", "orchestrator": "orchestrator"}
)
g.add_edge("research", "orchestrator")

g.add_conditional_edges("orchestrator", fanout, ["worker"])
g.add_edge("worker", "reducer")
g.add_edge("reducer", END)


# -----------------------------
# 3) Checkpointer (ConnectionPool with Fallback)
# -----------------------------
def init_checkpointer():
    try:
        database_url = get_database_url()
        pool = ConnectionPool(
            conninfo=database_url,
            max_size=20,
            kwargs={
                "autocommit": True,
                "prepare_threshold": 0,
                "row_factory": dict_row,
            },
        )
        checkpointer = PostgresSaver(pool)
        checkpointer.setup()
        logger.info("Postgres checkpointer successfully initialized.")
        return checkpointer
    except Exception as e:
        logger.warning(
            f"Failed to initialize PostgresSaver ({e}). Falling back to MemorySaver."
        )
        return MemorySaver()


checkpointer = init_checkpointer()
app = g.compile(checkpointer=checkpointer)