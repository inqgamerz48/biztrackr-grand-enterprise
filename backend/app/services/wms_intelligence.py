from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.models.warehouse import (
    Warehouse, WarehouseZone, WarehouseBin, BinStock,
    StockMovement, InwardLog, OutwardLog, DemandHistory
)
from app.models.inventory import InventoryItem
from app.models.crm import Supplier
import statistics


class WMSIntelligenceService:
    """
    Enterprise Warehouse Management System Intelligence Engine
    Provides AI-driven insights, recommendations, and optimization strategies
    """

    def __init__(self, db: AsyncSession, tenant_id: int):
        self.db = db
        self.tenant_id = tenant_id

    async def generate_warehouse_intelligence_report(
        self,
        warehouse_id: int = None,
        days_history: int = 30
    ) -> Dict[str, Any]:
        """
        Generate comprehensive warehouse intelligence report
        """
        
        # Gather all data
        products = await self._get_products()
        stock_levels = await self._get_stock_levels(warehouse_id)
        demand_data = await self._get_demand_history(days_history)
        inward_data = await self._get_inward_logs(days_history, warehouse_id)
        outward_data = await self._get_outward_logs(days_history, warehouse_id)
        bin_data = await self._get_bin_utilization(warehouse_id)
        
        # Analyze
        low_stock_alerts = await self._analyze_low_stock(products, stock_levels, demand_data)
        reorder_suggestions = await self._generate_reorder_recommendations(
            low_stock_alerts, demand_data, inward_data
        )
        optimal_bins = await self._optimize_bin_locations(
            stock_levels, demand_data, bin_data
        )
        anomalies = await self._detect_anomalies(
            inward_data, outward_data, stock_levels
        )
        performance = await self._calculate_warehouse_performance(
            inward_data, outward_data, bin_data, demand_data
        )
        action_plan = self._generate_action_plan(
            low_stock_alerts, anomalies, optimal_bins, performance
        )

        return {
            "generated_at": datetime.utcnow().isoformat(),
            "warehouse_id": warehouse_id,
            "analysis_period_days": days_history,
            "low_stock_alerts": low_stock_alerts,
            "reorder_suggestions": reorder_suggestions,
            "optimal_bin_locations": optimal_bins,
            "anomalies_detected": anomalies,
            "warehouse_performance": performance,
            "action_plan": action_plan
        }

    async def _get_products(self) -> List[InventoryItem]:
        """Fetch all products"""
        result = await self.db.execute(
            select(InventoryItem).where(InventoryItem.tenant_id == self.tenant_id)
        )
        return result.scalars().all()

    async def _get_stock_levels(self, warehouse_id: int = None) -> Dict[int, Dict]:
        """Get current stock levels per item and bin"""
        query = select(BinStock).where(BinStock.tenant_id == self.tenant_id)
        
        if warehouse_id:
            query = query.join(WarehouseBin).join(WarehouseZone).where(
                WarehouseZone.warehouse_id == warehouse_id
            )
        
        result = await self.db.execute(query)
        stocks = result.scalars().all()
        
        # Aggregate by item
        stock_map = {}
        for stock in stocks:
            if stock.item_id not in stock_map:
                stock_map[stock.item_id] = {
                    "total_quantity": 0,
                    "bins": [],
                    "bin_count": 0
                }
            stock_map[stock.item_id]["total_quantity"] += stock.quantity
            stock_map[stock.item_id]["bins"].append({
                "bin_id": stock.bin_id,
                "quantity": stock.quantity
            })
            stock_map[stock.item_id]["bin_count"] += 1
        
        return stock_map

    async def _get_demand_history(self, days: int) -> Dict[int, List[int]]:
        """Get demand history for velocity calculation"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.execute(
            select(DemandHistory).where(
                and_(
                    DemandHistory.tenant_id == self.tenant_id,
                    DemandHistory.date >= cutoff_date
                )
            ).order_by(DemandHistory.date)
        )
        history = result.scalars().all()
        
        # Group by item
        demand_map = {}
        for record in history:
            if record.item_id not in demand_map:
                demand_map[record.item_id] = []
            demand_map[record.item_id].append(record.quantity_sold)
        
        return demand_map

    async def _get_inward_logs(self, days: int, warehouse_id: int = None) -> List[InwardLog]:
        """Get inward logs for the period"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = select(InwardLog).where(
            and_(
                InwardLog.tenant_id == self.tenant_id,
                InwardLog.received_at >= cutoff_date
            )
        )
        
        if warehouse_id:
            query = query.where(InwardLog.warehouse_id == warehouse_id)
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def _get_outward_logs(self, days: int, warehouse_id: int = None) -> List[OutwardLog]:
        """Get outward logs for the period"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = select(OutwardLog).where(
            and_(
                OutwardLog.tenant_id == self.tenant_id,
                OutwardLog.picked_at >= cutoff_date
            )
        )
        
        if warehouse_id:
            query = query.where(OutwardLog.warehouse_id == warehouse_id)
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def _get_bin_utilization(self, warehouse_id: int = None) -> List[Dict]:
        """Calculate bin utilization"""
        query = select(WarehouseBin).where(WarehouseBin.tenant_id == self.tenant_id)
        
        if warehouse_id:
            query = query.join(WarehouseZone).where(
                WarehouseZone.warehouse_id == warehouse_id
            )
        
        result = await self.db.execute(query)
        bins = result.scalars().all()
        
        return [{
            "bin_id": bin.id,
            "bin_code": bin.bin_code,
            "zone_id": bin.zone_id,
            "capacity": bin.capacity,
            "current_load": bin.current_load,
            "utilization_pct": (bin.current_load / bin.capacity * 100) if bin.capacity > 0 else 0,
            "is_active": bin.is_active
        } for bin in bins]

    async def _analyze_low_stock(
        self,
        products: List[InventoryItem],
        stock_levels: Dict[int, Dict],
        demand_data: Dict[int, List[int]]
    ) -> List[Dict]:
        """Identify products with low stock and calculate days to stockout"""
        alerts = []
        
        for product in products:
            current_stock = stock_levels.get(product.id, {}).get("total_quantity", 0)
            min_stock = product.min_stock
            
            # Calculate velocity (average daily demand)
            demand_history = demand_data.get(product.id, [])
            if demand_history:
                avg_daily_demand = statistics.mean(demand_history) / len(demand_history)
            else:
                avg_daily_demand = 0
            
            # Days to stockout
            if avg_daily_demand > 0:
                days_to_stockout = current_stock / avg_daily_demand
            else:
                days_to_stockout = 999  # Infinite if no demand
            
            # Alert if below min stock or running out soon
            if current_stock <= min_stock or days_to_stockout < 14:
                # Calculate reorder point (ROL)
                lead_time_days = 7  # Assume 7 days lead time
                safety_stock = avg_daily_demand * 3  # 3 days buffer
                reorder_point = (avg_daily_demand * lead_time_days) + safety_stock
                
                alerts.append({
                    "item_id": product.id,
                    "sku": product.barcode or f"ITEM-{product.id}",
                    "name": product.name,
                    "current_stock": current_stock,
                    "min_stock": min_stock,
                    "avg_daily_demand": round(avg_daily_demand, 2),
                    "days_to_stockout": round(days_to_stockout, 1),
                    "status": "critical" if days_to_stockout < 7 else "warning",
                    "reorder_point": round(reorder_point, 0),
                    "safety_stock": round(safety_stock, 0)
                })
        
        return sorted(alerts, key=lambda x: x["days_to_stockout"])

    async def _generate_reorder_recommendations(
        self,
        low_stock_alerts: List[Dict],
        demand_data: Dict[int, List[int]],
        inward_data: List[InwardLog]
    ) -> List[Dict]:
        """Generate AI-powered reorder recommendations"""
        recommendations = []
        
        for alert in low_stock_alerts:
            item_id = alert["item_id"]
            avg_daily_demand = alert["avg_daily_demand"]
            
            # Economic Order Quantity (EOQ) simplified
            # For enterprise: Balance holding cost vs ordering cost
            # Assume 30-day cycle
            optimal_order_qty = max(
                int(avg_daily_demand * 30),  # 30-day supply
                alert["reorder_point"] * 2    # Or 2x reorder point
            )
            
            # Find best supplier based on recent inward activity
            supplier_performance = {}
            for log in inward_data:
                if log.item_id == item_id and log.supplier_id:
                    if log.supplier_id not in supplier_performance:
                        supplier_performance[log.supplier_id] = {
                            "count": 0,
                            "total_qty": 0,
                            "on_time": 0
                        }
                    supplier_performance[log.supplier_id]["count"] += 1
                    supplier_performance[log.supplier_id]["total_qty"] += log.quantity_received
            
            best_supplier_id = None
            if supplier_performance:
                # Choose supplier with highest delivery count
                best_supplier_id = max(
                    supplier_performance.items(),
                    key=lambda x: x[1]["count"]
                )[0]
            
            # Cost impact if delayed
            cost_per_stockout = 500  # Assume $500 per stockout event
            days_remaining = alert["days_to_stockout"]
            delay_risk_cost = cost_per_stockout if days_remaining < 7 else 0
            
            recommendations.append({
                "item_id": item_id,
                "name": alert["name"],
                "recommended_order_qty": optimal_order_qty,
                "reorder_immediately": alert["status"] == "critical",
                "best_supplier_id": best_supplier_id,
                "estimated_cost_if_delayed": delay_risk_cost,
                "reasoning": f"Based on {avg_daily_demand:.1f} units/day demand, recommend ordering {optimal_order_qty} units to cover 30 days."
            })
        
        return recommendations

    async def _optimize_bin_locations(
        self,
        stock_levels: Dict[int, Dict],
        demand_data: Dict[int, List[int]],
        bin_data: List[Dict]
    ) -> List[Dict]:
        """Recommend optimal bin placements for fast-moving items"""
        recommendations = []
        
        # Classify items by velocity
        item_velocities = []
        for item_id, demand_history in demand_data.items():
            if demand_history:
                avg_demand = statistics.mean(demand_history)
                item_velocities.append({
                    "item_id": item_id,
                    "avg_demand": avg_demand,
                    "current_bins": stock_levels.get(item_id, {}).get("bins", [])
                })
        
        # Sort by velocity
        item_velocities.sort(key=lambda x: x["avg_demand"], reverse=True)
        
        # Top 20% are fast movers
        fast_mover_threshold = int(len(item_velocities) * 0.2) or 1
        fast_movers = item_velocities[:fast_mover_threshold]
        slow_movers = item_velocities[fast_mover_threshold:]
        
        # Check bin utilization
        overloaded_bins = [b for b in bin_data if b["utilization_pct"] > 90]
        underutilized_bins = [b for b in bin_data if b["utilization_pct"] < 30]
        
        # Recommend relocations
        for item in fast_movers[:10]:  # Top 10 fast movers
            recommendations.append({
                "item_id": item["item_id"],
                "recommendation": "Place in fast-pick zone (closest to dispatch)",
                "reason": f"High velocity item ({item['avg_demand']:.1f} units/day). Minimize picking distance.",
                "priority": "high"
            })
        
        for item in slow_movers[-10:]:  # Bottom 10 slow movers
            recommendations.append({
                "item_id": item["item_id"],
                "recommendation": "Relocate to back/bulk storage zone",
                "reason": f"Low velocity item ({item['avg_demand']:.1f} units/day). Free up premium space.",
                "priority": "low"
            })
        
        # Flag bin issues
        for bin in overloaded_bins:
            recommendations.append({
                "bin_code": bin["bin_code"],
                "recommendation": "Redistribute stock to other bins",
                "reason": f"Bin at {bin['utilization_pct']:.1f}% capacity. Risk of overflow.",
                "priority": "high"
            })
        
        for bin in underutilized_bins:
            recommendations.append({
                "bin_code": bin["bin_code"],
                "recommendation": "Consider consolidating or deactivating",
                "reason": f"Bin only {bin['utilization_pct']:.1f}% utilized. Optimize space.",
                "priority": "low"
            })
        
        return recommendations

    async def _detect_anomalies(
        self,
        inward_data: List[InwardLog],
        outward_data: List[OutwardLog],
        stock_levels: Dict[int, Dict]
    ) -> List[Dict]:
        """Detect unusual patterns and discrepancies"""
        anomalies = []
        
        # Group outward by item
        outward_by_item = {}
        for log in outward_data:
            if log.item_id not in outward_by_item:
                outward_by_item[log.item_id] = []
            outward_by_item[log.item_id].append(log.quantity_picked)
        
        # Detect spikes
        for item_id, quantities in outward_by_item.items():
            if len(quantities) > 5:
                avg_qty = statistics.mean(quantities)
                std_dev = statistics.stdev(quantities) if len(quantities) > 1 else 0
                
                for qty in quantities:
                    if std_dev > 0 and qty > avg_qty + (2 * std_dev):
                        anomalies.append({
                            "type": "outward_spike",
                            "item_id": item_id,
                            "description": f"Unusual spike in outward quantity: {qty} units (avg: {avg_qty:.1f})",
                            "severity": "medium"
                        })
                        break
        
        # Check for GRN mismatches (quality check failures)
        rejected_grns = [log for log in inward_data if log.quality_check_status == "rejected"]
        if rejected_grns:
            for grn in rejected_grns:
                anomalies.append({
                    "type": "quality_rejection",
                    "item_id": grn.item_id,
                    "supplier_id": grn.supplier_id,
                    "description": f"GRN rejected for item {grn.item_id}. Quality issue detected.",
                    "severity": "high"
                })
        
        # Detect potential shrinkage (inventory discrepancy)
        # Compare expected vs actual stock (simplified)
        for item_id, stock_info in stock_levels.items():
            actual_stock = stock_info["total_quantity"]
            # If we had expected stock data, we'd compare here
            # For now, flag items with zero stock but recent outward activity
            if actual_stock == 0 and item_id in outward_by_item:
                anomalies.append({
                    "type": "potential_shrinkage",
                    "item_id": item_id,
                    "description": "Item has zero stock but recent outward activity recorded. Possible data inconsistency.",
                    "severity": "medium"
                })
        
        return anomalies

    async def _calculate_warehouse_performance(
        self,
        inward_data: List[InwardLog],
        outward_data: List[OutwardLog],
        bin_data: List[Dict],
        demand_data: Dict[int, List[int]]
    ) -> Dict[str, Any]:
        """Calculate key warehouse performance metrics"""
        
        # Picking accuracy (assuming picked = expected for now)
        total_picks = len(outward_data)
        successful_picks = len([o for o in outward_data if o.status in ["picked", "shipped"]])
        picking_accuracy = (successful_picks / total_picks * 100) if total_picks > 0 else 100
        
        # Warehouse space utilization
        total_capacity = sum(b["capacity"] for b in bin_data)
        total_used = sum(b["current_load"] for b in bin_data)
        space_utilization = (total_used / total_capacity * 100) if total_capacity > 0 else 0
        
        # Fast/slow movers
        item_velocities = []
        for item_id, history in demand_data.items():
            if history:
                item_velocities.append({
                    "item_id": item_id,
                    "total_demand": sum(history)
                })
        
        item_velocities.sort(key=lambda x: x["total_demand"], reverse=True)
        fast_movers = item_velocities[:10]
        slow_movers = item_velocities[-10:]
        
        # Cycle count accuracy (placeholder - requires actual cycle count data)
        cycle_count_accuracy = 95.0  # Mock value
        
        return {
            "picking_accuracy_pct": round(picking_accuracy, 2),
            "cycle_count_accuracy_pct": round(cycle_count_accuracy, 2),
            "warehouse_space_utilization_pct": round(space_utilization, 2),
            "total_inward_receipts": len(inward_data),
            "total_outward_picks": total_picks,
            "successful_picks": successful_picks,
            "top_fast_moving_items": [f"Item-{item['item_id']}" for item in fast_movers[:5]],
            "top_slow_moving_items": [f"Item-{item['item_id']}" for item in slow_movers[:5]],
            "active_bins": len([b for b in bin_data if b["is_active"]]),
            "total_bins": len(bin_data)
        }

    def _generate_action_plan(
        self,
        low_stock_alerts: List[Dict],
        anomalies: List[Dict],
        optimal_bins: List[Dict],
        performance: Dict[str, Any]
    ) -> List[str]:
        """Generate actionable step-by-step plan"""
        actions = []
        
        # Critical stock
        critical_items = [a for a in low_stock_alerts if a["status"] == "critical"]
        if critical_items:
            actions.append(
                f"URGENT: Place immediate purchase orders for {len(critical_items)} critical items within 24 hours to avoid stockouts."
            )
        
        # Reorders
        warning_items = [a for a in low_stock_alerts if a["status"] == "warning"]
        if warning_items:
            actions.append(
                f"Schedule reorders for {len(warning_items)} items approaching minimum stock levels within 7 days."
            )
        
        # Anomalies
        high_severity_anomalies = [a for a in anomalies if a["severity"] == "high"]
        if high_severity_anomalies:
            actions.append(
                f"Investigate {len(high_severity_anomalies)} high-severity anomalies (quality rejections, shrinkage) immediately."
            )
        
        # Bin optimization
        high_priority_relocations = [b for b in optimal_bins if b.get("priority") == "high"]
        if high_priority_relocations:
            actions.append(
                f"Relocate {len(high_priority_relocations)} fast-moving items to fast-pick zones to improve picking efficiency."
            )
        
        # Space utilization
        if performance["warehouse_space_utilization_pct"] > 85:
            actions.append(
                "Warehouse space utilization above 85%. Consider expanding capacity or optimizing slow-moving stock."
            )
        elif performance["warehouse_space_utilization_pct"] < 40:
            actions.append(
                "Warehouse space underutilized (<40%). Consider consolidating bins or subletting excess space."
            )
        
        # Picking accuracy
        if performance["picking_accuracy_pct"] < 95:
            actions.append(
                f"Picking accuracy at {performance['picking_accuracy_pct']:.1f}%. Implement training and barcode scanning to improve accuracy."
            )
        
        if not actions:
            actions.append("Warehouse operations are running smoothly. Continue monitoring KPIs.")
        
        return actions
